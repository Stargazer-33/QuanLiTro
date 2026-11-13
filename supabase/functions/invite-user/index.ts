import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond(405, { error: 'Method not allowed' });

  const authorization = request.headers.get('Authorization');
  if (!authorization) return respond(401, { error: 'Missing authorization' });

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) return respond(401, { error: 'Invalid session' });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: owner, error: ownerError } = await adminClient
    .from('profiles')
    .select('id, role, active')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (ownerError) return respond(500, { error: 'Unable to verify owner account' });
  if (!owner || owner.role !== 'owner' || !owner.active) {
    return respond(403, { error: 'Only an active owner can invite users' });
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return respond(400, { error: 'Invalid JSON body' });
  }
  const action = typeof input.action === 'string' ? input.action : 'create';
  /* Chủ trọ gửi mật khẩu tạm; nếu thiếu thì máy chủ tự sinh để trả về cho chủ trọ. */
  const password = typeof input.password === 'string' && input.password.length >= 8
    ? input.password
    : 'Tam@' + Math.floor(100000 + Math.random() * 900000);

  /* Đặt lại mật khẩu trực tiếp cho một tài khoản thuộc chủ trọ đang đăng nhập. */
  if (action === 'reset-password') {
    const profileId = typeof input.profile_id === 'string' ? input.profile_id : '';
    if (!profileId) return respond(400, { error: 'Profile is required' });
    const { data: target, error: targetError } = await adminClient
      .from('profiles')
      .select('id, owner_id')
      .eq('id', profileId)
      .maybeSingle();
    if (targetError) return respond(500, { error: 'Unable to verify profile' });
    if (!target || target.owner_id !== owner.id) {
      return respond(403, { error: 'Tài khoản không thuộc chủ trọ này.' });
    }
    const { error: updateError } = await adminClient.auth.admin.updateUserById(profileId, { password });
    if (updateError) return respond(400, { error: updateError.message });
    await adminClient.from('profiles').update({ must_change_password: false }).eq('id', profileId);
    return respond(200, { password });
  }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const fullName = typeof input.full_name === 'string' ? input.full_name.trim() : '';
  const role = input.role;
  const employeeId = typeof input.employee_id === 'string' ? input.employee_id : null;
  const tenantId = typeof input.tenant_id === 'string' ? input.tenant_id : null;
  const facilityId = typeof input.facility_id === 'string' ? input.facility_id : null;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName) {
    return respond(400, { error: 'A valid email and full name are required' });
  }
  if (role !== 'manager' && role !== 'tenant') {
    return respond(400, { error: 'Unsupported role' });
  }

  let tenantFacilityId: string | null = null;
  if (role === 'manager') {
    if (!employeeId || !facilityId) return respond(400, { error: 'Manager and facility are required' });
    const { data: facility, error: facilityError } = await adminClient
      .from('app_records')
      .select('payload')
      .eq('owner_id', owner.id)
      .eq('table_name', 'coso')
      .eq('record_id', facilityId)
      .maybeSingle();
    if (facilityError) return respond(500, { error: 'Unable to verify facility' });
    if (!facility || facility.payload?.quanLyId !== employeeId) {
      return respond(400, { error: 'The employee must be assigned to this facility first' });
    }

    const { data: employee, error: employeeError } = await adminClient
      .from('app_records')
      .select('record_id')
      .eq('owner_id', owner.id)
      .eq('table_name', 'nhanvien')
      .eq('record_id', employeeId)
      .maybeSingle();
    if (employeeError) return respond(500, { error: 'Unable to verify employee' });
    if (!employee) return respond(400, { error: 'Employee record was not found' });
  } else {
    if (!tenantId) return respond(400, { error: 'Tenant record is required' });
    const { data: tenant, error: tenantError } = await adminClient
      .from('app_records')
      .select('payload')
      .eq('owner_id', owner.id)
      .eq('table_name', 'khach')
      .eq('record_id', tenantId)
      .maybeSingle();
    if (tenantError) return respond(500, { error: 'Unable to verify tenant' });
    if (!tenant) return respond(400, { error: 'Tenant record was not found' });
    tenantFacilityId = typeof tenant.payload?.coSoId === 'string' ? tenant.payload.coSoId : null;
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    const message = createError?.message || 'Unable to create user';
    if (/already/i.test(message)) {
      return respond(400, { error: 'Email này đã có tài khoản Supabase.' });
    }
    return respond(400, { error: message });
  }

  const profile = {
    id: created.user.id,
    owner_id: owner.id,
    role,
    full_name: fullName,
    email,
    employee_id: role === 'manager' ? employeeId : null,
    tenant_id: role === 'tenant' ? tenantId : null,
    facility_id: role === 'manager' ? facilityId : tenantFacilityId,
    active: true,
    must_change_password: false,
  };
  const { data: createdProfile, error: profileError } = await adminClient
    .from('profiles')
    .insert(profile)
    .select('*')
    .single();
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return respond(400, { error: profileError.message });
  }
  return respond(200, { profile: createdProfile, password });
});

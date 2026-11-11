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

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: new URL('/html/dangnhap.html', request.headers.get('Origin') || supabaseUrl).toString(),
  });
  if (inviteError || !invited.user) {
    return respond(400, { error: inviteError?.message || 'Unable to send invitation' });
  }

  const profile = {
    id: invited.user.id,
    owner_id: owner.id,
    role,
    full_name: fullName,
    email,
    employee_id: role === 'manager' ? employeeId : null,
    tenant_id: role === 'tenant' ? tenantId : null,
    facility_id: role === 'manager' ? facilityId : tenantFacilityId,
    active: true,
    must_change_password: true,
  };
  const { data: createdProfile, error: profileError } = await adminClient
    .from('profiles')
    .insert(profile)
    .select('*')
    .single();
  if (profileError) {
    await adminClient.auth.admin.deleteUser(invited.user.id);
    return respond(400, { error: profileError.message });
  }
  return respond(200, { profile: createdProfile });
});

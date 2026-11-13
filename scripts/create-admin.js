/*
 * Tạo tài khoản chủ trọ đầu tiên trong Supabase Auth + profile owner.
 *
 * Cách chạy (PowerShell, tại thư mục dự án):
 *   $env:SUPABASE_URL="https://<project-ref>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
 *   $env:ADMIN_EMAIL="admin@example.com"
 *   $env:ADMIN_PASSWORD="MatKhau123!"
 *   node scripts/create-admin.js
 *
 * Lấy service role key tại Supabase Dashboard > Project Settings > API.
 * Không commit key này và không đặt nó trong file frontend.
 */

const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
const fullName = (process.env.ADMIN_NAME || 'Chủ trọ').trim();

if (!url || !serviceKey) {
  console.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('ADMIN_EMAIL không hợp lệ.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('ADMIN_PASSWORD phải có ít nhất 8 ký tự.');
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: 'Bearer ' + serviceKey,
  'Content-Type': 'application/json',
};

async function goi(path, options) {
  const res = await fetch(url + path, Object.assign({ headers }, options));
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, ok: res.ok, body };
}

async function timUserTheoEmail() {
  const res = await goi('/auth/v1/admin/users?page=1&per_page=1000');
  if (!res.ok) throw new Error('Không đọc được danh sách user: ' + JSON.stringify(res.body));
  const users = (res.body && res.body.users) || [];
  return users.find(function (u) { return String(u.email || '').toLowerCase() === email; }) || null;
}

async function taoHoacCapNhatUser() {
  const tao = await goi('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });

  if (tao.ok && tao.body && tao.body.id) {
    console.log('Đã tạo user Auth:', tao.body.id);
    return tao.body;
  }

  const daTonTai = /already|exists|registered/i.test(JSON.stringify(tao.body || ''));
  if (!daTonTai) {
    throw new Error('Tạo user thất bại: ' + JSON.stringify(tao.body));
  }

  const cu = await timUserTheoEmail();
  if (!cu) throw new Error('Email đã tồn tại nhưng không tìm thấy user để cập nhật.');

  const capNhat = await goi('/auth/v1/admin/users/' + cu.id, {
    method: 'PUT',
    body: JSON.stringify({ password, email_confirm: true, user_metadata: { full_name: fullName } }),
  });
  if (!capNhat.ok) throw new Error('Cập nhật user thất bại: ' + JSON.stringify(capNhat.body));
  console.log('Đã cập nhật user Auth có sẵn:', cu.id);
  return capNhat.body;
}

async function ghiProfile(user) {
  const res = await goi('/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: Object.assign({}, headers, {
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify({
      id: user.id,
      owner_id: null,
      role: 'owner',
      full_name: fullName,
      email,
      employee_id: null,
      tenant_id: null,
      facility_id: null,
      active: true,
      must_change_password: false,
    }),
  });
  if (!res.ok) throw new Error('Ghi profile thất bại: ' + JSON.stringify(res.body));
  console.log('Đã tạo/cập nhật profile owner.');
}

(async function () {
  try {
    const user = await taoHoacCapNhatUser();
    await ghiProfile(user);
    console.log('\nĐăng nhập bằng:');
    console.log('  Email   : ' + email);
    console.log('  Mật khẩu: ' + password);
  } catch (loi) {
    console.error(loi.message || loi);
    process.exit(1);
  }
})();

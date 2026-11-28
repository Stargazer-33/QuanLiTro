/* ============================================================
   dulieu.js — Lớp dữ liệu của ứng dụng quản lý phòng trọ.
   Dữ liệu nghiệp vụ được tải và lưu qua Supabase.
   Chỉ HTML/CSS/JS thuần.
   ============================================================ */

const KHOA_DB = 'lmaria_db_v1';
const KHOA_PHIEN = 'lmaria_phien_v1';
const KHOA_PHIEN_TAM = 'lmaria_phien_tam_v1';

/* Sinh id ngẫu nhiên cho bản ghi mới */
function taoId(tienTo) {
  return tienTo + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* Ngày hôm nay dạng YYYY-MM-DD theo giờ địa phương */
function _homNay() {
  const d = new Date();
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  const ngayTrongThang = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${thang}-${ngayTrongThang}`;
}

/* ------------------------------------------------------------
   Kho dữ liệu: đọc, ghi, thêm, sửa, xóa
   ------------------------------------------------------------ */
const DL = (function () {
  let boNho = null;
  const cauHinhSupabase = window.LMARIA_SUPABASE_CONFIG || null;
  const cheDoSupabase = !!(cauHinhSupabase && cauHinhSupabase.url && cauHinhSupabase.anonKey);
  let supabaseClient = null;
  let nguoiDungHienTai = null;
  let profileHienTai = null;
  let hangDoiGhi = Promise.resolve();

  /* Trạng thái tự động đồng bộ dữ liệu */
  let kenhRealtime = null;
  let henTaiLai = null;
  let henQuet = null;
  let henBaoVuaDoi = null;
  let dangTaiLai = null;
  let khiDuLieuDoi = null;
  let daTheoDoi = false;
  let lanBaoLoi = 0;

  const CAC_BANG = [
    'coso', 'phong', 'khach', 'nhanvien', 'nguoidung', 'hopdong',
    'hoadon', 'chiso', 'thanhtoan', 'suco', 'thongbao', 'chiphi', 'dichvu'
  ];

  function khoDuLieuTrong() {
    const du = {};
    CAC_BANG.forEach(function (bang) { du[bang] = []; });
    du._phienBan = 2;
    return du;
  }

  function baoLoiBackend(loi) {
    console.error('Lỗi Supabase:', loi);
    if (typeof window.thongBao === 'function') {
      window.thongBao('Không thể lưu/tải dữ liệu từ Supabase: ' + (loi.message || loi), 'loi');
    }
  }

  function vaiTroUngDung(vaiTro) {
    return { owner: 'admin', manager: 'quanly', tenant: 'khachthue' }[vaiTro] || '';
  }

  function hoSoThanhNguoiDung(profile) {
    return {
      id: profile.id,
      tenDangNhap: profile.email,
      vaiTro: vaiTroUngDung(profile.role),
      hoTen: profile.full_name,
      hoSoId: profile.tenant_id || profile.employee_id || null,
      loaiHoSo: profile.role === 'tenant' ? 'khach' : (profile.role === 'manager' ? 'nhanvien' : null),
      trangThai: profile.active ? 'hoatdong' : 'khoa',
      phaiDoiMatKhau: !!profile.must_change_password,
      ngayTao: String(profile.created_at || '').slice(0, 10),
      ownerId: profile.owner_id,
      facilityId: profile.facility_id
    };
  }

  function loiSupabase(ketQua) {
    if (ketQua.error) throw ketQua.error;
    return ketQua.data;
  }

  async function goiHamInviteUser(body) {
    const ketQuaPhien = await supabaseClient.auth.getSession();
    if (ketQuaPhien.error) throw ketQuaPhien.error;
    let session = ketQuaPhien.data.session;
    if (!session) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

    let ketQua = await supabaseClient.functions.invoke('invite-user', {
      body: body,
      headers: { Authorization: 'Bearer ' + session.access_token }
    });
    if (!ketQua.error || !ketQua.error.context || ketQua.error.context.status !== 401) return ketQua;

    const ketQuaLamMoi = await supabaseClient.auth.refreshSession();
    if (ketQuaLamMoi.error) throw ketQuaLamMoi.error;
    session = ketQuaLamMoi.data.session;
    if (!session) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

    return supabaseClient.functions.invoke('invite-user', {
      body: body,
      headers: { Authorization: 'Bearer ' + session.access_token }
    });
  }

  /* Chuỗi đại diện dữ liệu để so sánh thay đổi.
     Sắp xếp bản sao theo id nên không phụ thuộc thứ tự Supabase trả về
     và không làm đổi thứ tự dữ liệu đang dùng trong ứng dụng. */
  function chuoiSoSanh(du) {
    if (!du) return '';
    const ban = { _phienBan: du._phienBan };
    CAC_BANG.concat(['nguoidung']).forEach(function (bang) {
      ban[bang] = (du[bang] || []).slice().sort(function (a, b) {
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
    });
    return JSON.stringify(ban);
  }

  async function napNguoiDung(user) {
    const p = loiSupabase(await supabaseClient.from('profiles')
      .select('*').eq('id', user.id).single());
    if (!p.active) throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ chủ trọ.');
    if (p.role !== 'owner' && !p.owner_id) throw new Error('Hồ sơ chưa liên kết chủ trọ.');
    if (p.role === 'manager' && !p.facility_id) throw new Error('Tài khoản quản lý chưa được gán cơ sở.');
    if (p.role === 'tenant' && !p.tenant_id) throw new Error('Tài khoản khách thuê chưa được liên kết hồ sơ.');

    profileHienTai = p;
    nguoiDungHienTai = hoSoThanhNguoiDung(p);
    const ownerId = p.role === 'owner' ? p.id : p.owner_id;
    const ketQua = loiSupabase(await supabaseClient.from('app_records')
      .select('table_name, record_id, facility_id, tenant_id, payload')
      .eq('owner_id', ownerId));
    const du = khoDuLieuTrong();
    ketQua.forEach(function (hang) {
      if (!du[hang.table_name]) return;
      du[hang.table_name].push(Object.assign({}, hang.payload, { id: hang.record_id }));
    });

    const profiles = loiSupabase(await supabaseClient.from('profiles').select('*'));
    du.nguoidung = profiles.map(hoSoThanhNguoiDung);
    boNho = du;
    return nguoiDungHienTai;
  }

  /* Nạp dữ liệu công khai (phòng trống, giá dịch vụ) khi chưa đăng nhập */
  async function napDuLieuCongKhai() {
    const du = khoDuLieuTrong();
    const congKhai = loiSupabase(await supabaseClient.from('app_records')
      .select('table_name, record_id, payload')
      .in('table_name', ['phong', 'dichvu']));
    congKhai.forEach(function (hang) {
      if (!du[hang.table_name]) return;
      du[hang.table_name].push(Object.assign({}, hang.payload, { id: hang.record_id }));
    });
    boNho = du;
  }

  async function khoiTao() {
    if (!cheDoSupabase) {
      throw new Error('Thiếu cấu hình Supabase. Ứng dụng chỉ sử dụng dữ liệu từ Supabase.');
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Không tải được thư viện Supabase. Kiểm tra kết nối mạng hoặc CDN.');
    }
    if (!supabaseClient) {
      supabaseClient = window.supabase.createClient(cauHinhSupabase.url, cauHinhSupabase.anonKey, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
      });
    }
    const ketQua = await supabaseClient.auth.getSession();
    if (ketQua.error) throw ketQua.error;
    const session = ketQua.data.session;
    if (!session) {
      nguoiDungHienTai = null;
      profileHienTai = null;
      boNho = khoDuLieuTrong();
      /* Trang giới thiệu công khai: nạp phòng trống và bảng giá dịch vụ
         qua policy dành cho anon (xem migration 202611110005). */
      await napDuLieuCongKhai();
      return;
    }
    await napNguoiDung(session.user);
  }

  function xepGhi(hanhDong) {
    hangDoiGhi = hangDoiGhi.then(hanhDong).catch(function (loi) {
      baoLoiBackend(loi);
    });
    return hangDoiGhi;
  }

  /* ===== Tự động đồng bộ dữ liệu ===== */

  /* Báo cho giao diện biết dữ liệu vừa thay đổi (gộp các thay đổi liên tiếp) */
  function baoVuaDoi() {
    if (henBaoVuaDoi) clearTimeout(henBaoVuaDoi);
    henBaoVuaDoi = setTimeout(function () {
      henBaoVuaDoi = null;
      if (typeof window.duLieuVuaDoi === 'function') window.duLieuVuaDoi();
    }, 150);
  }

  /* Tải lại toàn bộ dữ liệu từ Supabase.
     Trả về true nếu dữ liệu khác với lần tải trước. */
  function taiLaiDuLieu() {
    if (!cheDoSupabase || !supabaseClient) return Promise.resolve(false);
    if (dangTaiLai) return dangTaiLai;
    dangTaiLai = (async function () {
      try {
        /* Chờ các thao tác ghi đang xếp hàng xong để đọc được dữ liệu mới nhất */
        await hangDoiGhi;
        const ketQua = await supabaseClient.auth.getSession();
        if (ketQua.error) throw ketQua.error;
        const session = ketQua.data.session;
        const truoc = chuoiSoSanh(boNho);
        if (session) {
          await napNguoiDung(session.user);
        } else if (nguoiDungHienTai) {
          /* Phiên đã bị đăng xuất ở nơi khác: dừng theo dõi và báo lỗi */
          nguoiDungHienTai = null;
          profileHienTai = null;
          boNho = khoDuLieuTrong();
          ngatTheoDoi();
          throw new Error('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
        } else {
          await napDuLieuCongKhai();
        }
        return truoc !== chuoiSoSanh(boNho);
      } finally {
        dangTaiLai = null;
      }
    })();
    return dangTaiLai;
  }

  function taiLaiVaBao() {
    taiLaiDuLieu().then(function (coThayDoi) {
      if (coThayDoi && khiDuLieuDoi) khiDuLieuDoi();
    }).catch(function (loi) {
      console.error('Tải lại dữ liệu thất bại:', loi);
      if (String((loi && loi.message) || '').indexOf('Phiên đăng nhập đã kết thúc') === 0) {
        if (typeof window.xuLyMatPhien === 'function') window.xuLyMatPhien();
        return;
      }
      /* Tránh báo lỗi lặp lại quá dày khi mất mạng */
      if (Date.now() - lanBaoLoi > 60000 && typeof window.thongBao === 'function') {
        lanBaoLoi = Date.now();
        window.thongBao('Không thể cập nhật dữ liệu mới: ' + (loi.message || loi), 'loi');
      }
    });
  }

  /* Gộp các sự kiện thay đổi dồn dập thành một lần tải lại */
  function henTaiLaiDuLieu() {
    if (henTaiLai) clearTimeout(henTaiLai);
    henTaiLai = setTimeout(function () {
      henTaiLai = null;
      taiLaiVaBao();
    }, 400);
  }

  function ngatTheoDoi() {
    if (kenhRealtime && supabaseClient) {
      try { supabaseClient.removeChannel(kenhRealtime); } catch (e) { /* bỏ qua */ }
    }
    kenhRealtime = null;
    if (henQuet) { clearInterval(henQuet); henQuet = null; }
    if (henTaiLai) { clearTimeout(henTaiLai); henTaiLai = null; }
    if (henBaoVuaDoi) { clearTimeout(henBaoVuaDoi); henBaoVuaDoi = null; }
  }

  /* Nghe thay đổi trên Supabase Realtime */
  function batDauRealtime() {
    if (!cheDoSupabase || !supabaseClient || !profileHienTai) return;
    const ownerId = profileHienTai.role === 'owner' ? profileHienTai.id : profileHienTai.owner_id;
    if (!ownerId) return;
    if (kenhRealtime) {
      try { supabaseClient.removeChannel(kenhRealtime); } catch (e) { /* bỏ qua */ }
    }
    kenhRealtime = supabaseClient
      .channel('lmaria-du-lieu-' + ownerId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_records', filter: 'owner_id=eq.' + ownerId },
        henTaiLaiDuLieu)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: 'id=eq.' + profileHienTai.id },
        henTaiLaiDuLieu);
    if (profileHienTai.role === 'owner') {
      kenhRealtime = kenhRealtime.on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: 'owner_id=eq.' + ownerId },
        henTaiLaiDuLieu);
    }
    kenhRealtime.subscribe(function (trangThai) {
      if (trangThai === 'CHANNEL_ERROR' || trangThai === 'TIMED_OUT') {
        console.warn('Realtime mất kết nối, chuyển sang quét định kỳ.');
      }
    });
  }

  /* Quét dự phòng khi Realtime bị tắt hoặc mất kết nối */
  function batDauQuet() {
    if (henQuet) clearInterval(henQuet);
    henQuet = setInterval(function () {
      if (document.visibilityState === 'hidden') return;
      taiLaiVaBao();
    }, 20000);
  }

  /* Quay lại tab thì cập nhật ngay */
  function khiQuayLaiTab() {
    if (document.visibilityState === 'hidden') return;
    taiLaiVaBao();
  }

  /* Chế độ localStorage: đồng bộ khi tab khác ghi dữ liệu */
  function khiStorageDoi(e) {
    if (cheDoSupabase || e.key !== KHOA_DB) return;
    boNho = null;
    doc();
    if (khiDuLieuDoi) khiDuLieuDoi();
  }

  /* Bật tự động cập nhật. callback được gọi khi dữ liệu thật sự thay đổi. */
  function batDauTheoDoi(callback) {
    khiDuLieuDoi = typeof callback === 'function' ? callback : null;
    if (!cheDoSupabase) {
      if (!daTheoDoi) {
        daTheoDoi = true;
        window.addEventListener('storage', khiStorageDoi);
      }
      return;
    }
    if (!daTheoDoi) {
      daTheoDoi = true;
      document.addEventListener('visibilitychange', khiQuayLaiTab);
      window.addEventListener('focus', khiQuayLaiTab);
    }
    batDauRealtime();
    batDauQuet();
  }

  function ghiBanGhi(bang, obj, chiCapNhat) {
    if (!cheDoSupabase || bang === 'nguoidung') return;
    if (!profileHienTai) {
      baoLoiBackend(new Error('Cần đăng nhập trước khi ghi dữ liệu.'));
      return;
    }
    const ownerId = profileHienTai.role === 'owner' ? profileHienTai.id : profileHienTai.owner_id;
    xepGhi(async function () {
      if (chiCapNhat) {
        loiSupabase(await supabaseClient.from('app_records').update({ payload: obj })
          .eq('owner_id', ownerId).eq('table_name', bang).eq('record_id', String(obj.id)));
        return;
      }
      loiSupabase(await supabaseClient.from('app_records').upsert({
        owner_id: ownerId,
        table_name: bang,
        record_id: String(obj.id),
        payload: obj
      }, { onConflict: 'owner_id,table_name,record_id' }));
    });
  }

  function ghiHoSo(nguoiDung) {
    if (!cheDoSupabase || !profileHienTai) return;
    const du = {};
    if (nguoiDung.hoTen !== undefined) du.full_name = nguoiDung.hoTen;
    if (nguoiDung.trangThai !== undefined) du.active = nguoiDung.trangThai === 'hoatdong';
    if (nguoiDung.phaiDoiMatKhau !== undefined) du.must_change_password = !!nguoiDung.phaiDoiMatKhau;
    if (!Object.keys(du).length) return;
    xepGhi(async function () {
      loiSupabase(await supabaseClient.rpc('update_profile_settings', {
        p_profile_id: nguoiDung.id,
        p_full_name: du.full_name || null,
        p_active: typeof du.active === 'boolean' ? du.active : null,
        p_must_change_password: typeof du.must_change_password === 'boolean' ? du.must_change_password : null
      }));
      const local = (boNho.nguoidung || []).find(function (x) { return x.id === nguoiDung.id; });
      if (local) Object.assign(local, nguoiDung);
      baoVuaDoi();
    });
  }

  function luu() {
    try {
      localStorage.setItem(KHOA_DB, JSON.stringify(boNho));
    } catch (e) {
      console.error('Không lưu được dữ liệu:', e);
    }
  }

  function chuanHoaDuLieu(du) {
    if (!Array.isArray(du.coso) || !du.coso.length) {
      const taiKhoanQuanLy = (du.nguoidung || []).find(function (u) {
        return u.vaiTro === 'quanly' && u.loaiHoSo === 'nhanvien';
      });
      du.coso = [{
        id: 'cs001', ma: 'CS-001', ten: 'Cơ sở chính',
        diaChi: '', quanLyId: taiKhoanQuanLy ? taiKhoanQuanLy.hoSoId : null
      }];
    }

    const coSoMacDinh = du.coso[0].id;
    (du.phong || []).forEach(function (p) {
      if (!p.coSoId || !du.coso.some(function (c) { return c.id === p.coSoId; })) {
        p.coSoId = coSoMacDinh;
      }
    });
    (du.khach || []).forEach(function (k) {
      if (!k.coSoId || !du.coso.some(function (c) { return c.id === k.coSoId; })) {
        const phong = (du.phong || []).find(function (p) { return p.id === k.phongId; });
        k.coSoId = phong ? phong.coSoId : coSoMacDinh;
      }
    });
    du._phienBan = 2;
    return du;
  }

  function doc() {
    if (boNho) return boNho;
    if (cheDoSupabase) {
      boNho = khoDuLieuTrong();
      return boNho;
    }
    let du = null;
    try {
      const raw = localStorage.getItem(KHOA_DB);
      if (raw) du = JSON.parse(raw);
    } catch (e) {
      du = null;
    }
    if (!du || typeof du !== 'object' || Array.isArray(du)) du = khoDuLieuTrong();
    if (!Array.isArray(du.phong)) du.phong = [];
    boNho = chuanHoaDuLieu(du);
    luu();
    return boNho;
  }

  function nguoiDungDangNhap() {
    if (cheDoSupabase) return nguoiDungHienTai;
    try {
      const raw = sessionStorage.getItem(KHOA_PHIEN_TAM) || localStorage.getItem(KHOA_PHIEN);
      if (!raw) return null;
      const goi = JSON.parse(raw);
      return (doc().nguoidung || []).find(function (u) {
        return u.id === goi.userId && u.trangThai === 'hoatdong';
      }) || null;
    } catch (e) {
      return null;
    }
  }

  function coSoCuaNguoiDung(nguoiDung) {
    if (!nguoiDung || nguoiDung.vaiTro !== 'quanly' || !nguoiDung.hoSoId) return null;
    const coSo = (doc().coso || []).find(function (c) {
      return c.quanLyId === nguoiDung.hoSoId;
    });
    return coSo || null;
  }

  function coSoCuaPhien() {
    return coSoCuaNguoiDung(nguoiDungDangNhap());
  }

  /* Lấy toàn bộ bảng */
  function lay(bang) {
    const du = doc();
    const ds = du[bang] || [];
    const nguoiDung = nguoiDungDangNhap();
    if (!nguoiDung || nguoiDung.vaiTro !== 'quanly') return ds;

    const coSo = coSoCuaNguoiDung(nguoiDung);
    if (!coSo) return [];
    if (bang === 'coso') return ds.filter(function (c) { return c.id === coSo.id; });
    if (bang === 'nhanvien') return ds.filter(function (nv) { return nv.id === nguoiDung.hoSoId; });
    if (bang === 'nguoidung') return ds.filter(function (u) { return u.id === nguoiDung.id; });

    const phongIds = new Set((du.phong || []).filter(function (p) {
      return p.coSoId === coSo.id;
    }).map(function (p) { return p.id; }));
    if (bang === 'phong') return ds.filter(function (p) { return phongIds.has(p.id); });
    if (bang === 'khach') return ds.filter(function (k) {
      return k.coSoId === coSo.id || phongIds.has(k.phongId);
    });
    if (['hopdong', 'hoadon', 'chiso', 'suco'].indexOf(bang) >= 0) {
      return ds.filter(function (x) { return phongIds.has(x.phongId); });
    }
    if (bang === 'thanhtoan') {
      const hoaDonIds = new Set((du.hoadon || []).filter(function (h) {
        return phongIds.has(h.phongId);
      }).map(function (h) { return h.id; }));
      return ds.filter(function (t) { return hoaDonIds.has(t.hoaDonId); });
    }
    if (bang === 'chiphi') return [];
    return ds;
  }

  /* Tìm một bản ghi theo id */
  function tim(bang, id) {
    return lay(bang).find(function (x) { return x.id === id; }) || null;
  }

  function giaTriDaTonTai(bang, truong, giaTri, boQuaId) {
    const canTim = String(giaTri || '').toLowerCase();
    return (doc()[bang] || []).some(function (x) {
      return x.id !== boQuaId && String(x[truong] || '').toLowerCase() === canTim;
    });
  }

  function soBanGhiToanBo(bang) {
    return (doc()[bang] || []).length;
  }

  /* Thêm bản ghi mới, tự sinh id */
  function them(bang, obj) {
    if (bang === 'phong') {
      const nguoiDung = nguoiDungDangNhap();
      const coSo = coSoCuaNguoiDung(nguoiDung);
      if (coSo) obj.coSoId = coSo.id;
    }
    const ds = doc()[bang] || (doc()[bang] = []);
    if (!obj.id) obj.id = taoId(bang);
    ds.push(obj);
    if (cheDoSupabase) ghiBanGhi(bang, obj);
    else luu();
    baoVuaDoi();
    return obj;
  }

  /* Cập nhật một phần bản ghi */
  function sua(bang, id, thayDoi) {
    if (cheDoSupabase && bang === 'nguoidung') {
      const nguoiDung = tim('nguoidung', id);
      if (!nguoiDung) return null;
      Object.assign(nguoiDung, thayDoi);
      ghiHoSo(nguoiDung);
      baoVuaDoi();
      return nguoiDung;
    }
    const o = tim(bang, id);
    if (!o) return null;
    Object.assign(o, thayDoi);
    if (cheDoSupabase) ghiBanGhi(bang, o, true);
    else luu();
    baoVuaDoi();
    return o;
  }

  /* Ghi nhận lượt khách mở hóa đơn (khách thuê không được update trực tiếp) */
  async function tangLuotMoHoaDon(hoaDonId) {
    if (cheDoSupabase) {
      loiSupabase(await supabaseClient.rpc('increment_invoice_view', {
        p_invoice_id: String(hoaDonId)
      }));
      const hd = tim('hoadon', hoaDonId);
      if (hd) hd.luotMo = (Number(hd.luotMo) || 0) + 1;
      return;
    }
    const hd = tim('hoadon', hoaDonId);
    if (hd) sua('hoadon', hoaDonId, { luotMo: (Number(hd.luotMo) || 0) + 1 });
  }

  /* Xóa bản ghi */
  function xoa(bang, id) {
    const banGhi = tim(bang, id);
    if (!banGhi) return false;
    if (cheDoSupabase && !profileHienTai) {
      baoLoiBackend(new Error('Cần đăng nhập trước khi xóa dữ liệu.'));
      return false;
    }
    const ds = doc()[bang] || [];
    const i = ds.findIndex(function (x) { return x.id === id; });
    if (i < 0) return false;
    ds.splice(i, 1);
    if (cheDoSupabase) {
      const ownerId = profileHienTai.role === 'owner' ? profileHienTai.id : profileHienTai.owner_id;
      xepGhi(async function () {
        loiSupabase(await supabaseClient.from('app_records').delete()
          .eq('owner_id', ownerId).eq('table_name', bang).eq('record_id', id));
      });
    } else luu();
    baoVuaDoi();
    return true;
  }

  /* Xóa tài khoản Supabase Auth kèm profile (chỉ chủ trọ).
     Ở chế độ local, xóa thẳng bản ghi người dùng. */
  async function xoaTaiKhoan(userId) {
    if (!cheDoSupabase) return xoa('nguoidung', userId);
    const user = tim('nguoidung', userId);
    if (!user) return false;
    if (!profileHienTai || profileHienTai.role !== 'owner') {
      throw new Error('Chỉ chủ trọ mới được xóa tài khoản.');
    }
    await hangDoiGhi;
    const result = await goiHamInviteUser({ action: 'delete-user', profile_id: userId });
    if (result.error) {
      let loi = result.error.message;
      try {
        const body = await result.error.context.json();
        if (body && body.error) loi = body.error;
      } catch (e) { /* giữ thông báo mặc định */ }
      throw new Error(loi);
    }
    const ds = boNho.nguoidung || [];
    const i = ds.findIndex(function (u) { return u.id === userId; });
    if (i >= 0) ds.splice(i, 1);
    baoVuaDoi();
    return true;
  }

  /* ===== Nghiệp vụ dùng chung ===== */

  function hopDongHieuLuc(phongId) {
    return lay('hopdong').find(function (h) {
      return h.phongId === phongId && h.trangThai === 'hieuluc';
    }) || null;
  }

  function hopDongCuaKhach(khachId) {
    return lay('hopdong').find(function (h) {
      return h.khachId === khachId && h.trangThai === 'hieuluc';
    }) || null;
  }

  function hoaDonTrongKy(phongId, ky) {
    return lay('hoadon').find(function (h) {
      return h.phongId === phongId && h.ky === ky && h.trangThai !== 'huy';
    }) || null;
  }

  function daThu(hoaDonId) {
    return lay('thanhtoan')
      .filter(function (t) { return t.hoaDonId === hoaDonId; })
      .reduce(function (tong, t) { return tong + (Number(t.soTien) || 0); }, 0);
  }

  function conNo(hoaDon) {
    return Math.max(0, (Number(hoaDon.tong) || 0) - daThu(hoaDon.id));
  }

  /* Trạng thái hiển thị của hóa đơn */
  function trangThaiHoaDon(hd) {
    const da = daThu(hd.id);
    if (hd.trangThai === 'huy') {
      return { chu: 'Đã hủy', loai: 'huy', con: 0, daThu: da, quaHan: false };
    }
    const con = Math.max(0, (Number(hd.tong) || 0) - da);
    const qua = con > 0 && hd.han < _homNay();
    let chu = 'Chưa thanh toán';
    let loai = 'moi';
    if (da > 0 && con > 0) { chu = 'Thanh toán một phần'; loai = 'mot-phan'; }
    if (con <= 0) { chu = 'Đã thanh toán'; loai = 'xong'; }
    if (qua) { chu += ' · quá hạn'; loai = 'qua-han'; }
    return { chu: chu, loai: loai, con: con, daThu: da, quaHan: qua };
  }

  /* Cột kanban của hóa đơn */
  function cotKanban(hd) {
    if (hd.trangThai === 'huy') return null;
    const tt = trangThaiHoaDon(hd);
    if (tt.con <= 0) return 'da';
    if (tt.quaHan) return 'qua';
    if (tt.daThu > 0) return 'mot';
    return 'chua';
  }

  /* Đồng bộ trạng thái phòng theo hợp đồng hiệu lực */
  function dongBoPhong() {
    lay('phong').forEach(function (p) {
      if (p.trangThai === 'baotri') return;
      const hd = hopDongHieuLuc(p.id);
      const moi = hd ? 'dangthue' : 'trong';
      if (p.trangThai !== moi) sua('phong', p.id, { trangThai: moi });
    });
    if (!cheDoSupabase) luu();
  }

  /* Tính tiền hóa đơn từ sản lượng và đơn giá */
  function tinhTong(o) {
    const tienDien = Math.round((Number(o.soDien) || 0) * (Number(o.giaDien) || 0));
    const tienNuoc = Math.round((Number(o.soNuoc) || 0) * (Number(o.giaNuoc) || 0));
    const tong = (Number(o.tienThue) || 0) + tienDien + tienNuoc + (Number(o.phiDichVu) || 0);
    return { tienDien: tienDien, tienNuoc: tienNuoc, tong: tong };
  }

  /* Gợi ý chỉ số cho một phòng trong kỳ: lấy chỉ số cuối của kỳ trước */
  function goiYChiSo(phongId, ky) {
    const daCo = lay('chiso').find(function (c) {
      return c.phongId === phongId && c.ky === ky;
    });
    if (daCo) {
      return {
        dienDau: daCo.dienDau, dienCuoi: daCo.dienCuoi,
        nuocDau: daCo.nuocDau, nuocCuoi: daCo.nuocCuoi,
        soDien: Math.max(0, daCo.dienCuoi - daCo.dienDau),
        soNuoc: Math.max(0, daCo.nuocCuoi - daCo.nuocDau),
        daChot: true
      };
    }
    const truoc = lay('chiso')
      .filter(function (c) { return c.phongId === phongId && c.ky < ky; })
      .sort(function (a, b) { return a.ky < b.ky ? 1 : -1; })[0];
    return {
      dienDau: truoc ? truoc.dienCuoi : 0,
      dienCuoi: truoc ? truoc.dienCuoi : 0,
      nuocDau: truoc ? truoc.nuocCuoi : 0,
      nuocCuoi: truoc ? truoc.nuocCuoi : 0,
      soDien: 0, soNuoc: 0, daChot: false
    };
  }

  /* Lưu chỉ số điện nước (ghi mới hoặc cập nhật theo kỳ).
     Gắn khachId của hợp đồng hiệu lực để RLS cho khách thuê đọc được chỉ số. */
  function luuChiSo(phongId, ky, du) {
    const daCo = lay('chiso').find(function (c) {
      return c.phongId === phongId && c.ky === ky;
    });
    const hopDong = hopDongHieuLuc(phongId);
    const duDay = Object.assign({ phongId: phongId, ky: ky }, du);
    if (hopDong && hopDong.khachId) duDay.khachId = hopDong.khachId;
    if (daCo) return sua('chiso', daCo.id, duDay);
    return them('chiso', duDay);
  }

  /* ===== Tài khoản & đăng nhập ===== */

  function nguoiDungCuaHoSo(hoSoId, loaiHoSo) {
    return lay('nguoidung').find(function (u) {
      return u.hoSoId === hoSoId && u.loaiHoSo === loaiHoSo;
    }) || null;
  }

  function laEmailHopLe(chu) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(chu || '').trim());
  }

  /* Đổi email/SĐT thành tên đăng nhập. Nếu hồ sơ chưa có email,
     tự sinh tên đăng nhập để chủ trọ gửi cho người dùng. */
  function tenDangNhapTuHoSo(hoso) {
    const email = String(hoso.email || '').trim().toLowerCase();
    if (laEmailHopLe(email)) return email;
    return emailTuDongTuHoSo({
      sdt: hoso.sdt,
      hoSoId: hoso.hoSoId || hoso.id
    });
  }

  /* Sinh tên đăng nhập khi hồ sơ chưa có email: SĐT@tenant.local,
     nếu không có SĐT thì dùng mã hồ sơ. Tài khoản được tạo với
     email_confirm = true nên địa chỉ này không cần nhận thư. */
  function emailTuDongTuHoSo(o) {
    const sdt = String(o.sdt || '').replace(/\D/g, '');
    const ma = String(o.hoSoId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (sdt || ma || Date.now().toString(36)) + '@tenant.local';
  }

  function taoMatKhauTam() {
    return 'Tam@' + Math.floor(100000 + Math.random() * 900000);
  }

  /* Cấp tài khoản mới với mật khẩu tạm, trả về mật khẩu để hiển thị một lần.
     Chủ trọ tạo thẳng tài khoản + mật khẩu trong Supabase Auth để người dùng
     đăng nhập ngay, không cần mở email mời. */
  async function capTaiKhoan(o) {
    let ten = tenDangNhapTuHoSo(o);
    if (!laEmailHopLe(o.email)) {
      /* Tên tự sinh có thể trùng nếu hai hồ sơ dùng cùng SĐT:
         thêm mã hồ sơ để không đụng tài khoản khác. */
      const dsNguoiDung = cheDoSupabase ? (boNho.nguoidung || []) : (doc().nguoidung || []);
      const trung = dsNguoiDung.some(function (u) {
        return String(u.tenDangNhap || '').toLowerCase() === ten && u.hoSoId !== o.hoSoId;
      });
      if (trung) {
        const ma = String(o.hoSoId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        ten = ten.replace('@tenant.local', '.' + (ma || Date.now().toString(36)) + '@tenant.local');
      }
    }
    if (cheDoSupabase) {
      if (!profileHienTai || profileHienTai.role !== 'owner') {
        return { ok: false, loi: 'Chỉ chủ trọ mới được cấp tài khoản.' };
      }
      const email = ten;
      const loai = o.vaiTro === 'quanly' ? 'manager' : 'tenant';
      const coSo = loai === 'manager'
        ? (boNho.coso || []).find(function (c) { return c.quanLyId === o.hoSoId; })
        : null;
      if (loai === 'manager' && !coSo) {
        return { ok: false, loi: 'Hãy phân công nhân viên vào một cơ sở trước khi cấp tài khoản quản lý.' };
      }
      const matKhau = taoMatKhauTam();
      await hangDoiGhi;
      const result = await goiHamInviteUser({
        email: email,
        password: matKhau,
        full_name: o.hoTen,
        role: loai,
        employee_id: loai === 'manager' ? o.hoSoId : null,
        tenant_id: loai === 'tenant' ? o.hoSoId : null,
        facility_id: coSo ? coSo.id : (o.coSoId || null)
      });
      if (result.error) {
        let loi = result.error.message;
        try {
          const body = await result.error.context.json();
          if (body && body.error) loi = body.error;
        } catch (e) { /* giữ thông báo mặc định */ }
        if (/rate limit|too many|email.*limit/i.test(loi)) {
          return {
            ok: false,
            loi: 'Hàm invite-user trên Supabase vẫn là bản cũ nên đang gửi email mời và bị giới hạn. ' +
              'Hãy deploy lại hàm invite-user (xem README) để cấp tài khoản trực tiếp, không gửi email.'
          };
        }
        return { ok: false, loi: loi };
      }
      const profile = result.data && result.data.profile;
      if (!profile) return { ok: false, loi: 'Máy chủ không trả về hồ sơ tài khoản.' };
      const matKhauMoi = result.data && result.data.password;
      if (!matKhauMoi) {
        return {
          ok: false,
          loi: 'Edge Function invite-user chưa được cập nhật. Hãy deploy lại hàm này rồi thử lại.'
        };
      }
      const user = hoSoThanhNguoiDung(profile);
      boNho.nguoidung.push(user);
      return { ok: true, nguoidung: user, matKhau: matKhauMoi };
    }
    const daCo = (doc().nguoidung || []).find(function (u) {
      return u.tenDangNhap.toLowerCase() === ten.toLowerCase();
    });
    if (daCo) {
      return { ok: false, loi: 'Hồ sơ này đã có tài khoản đăng nhập.' };
    }
    const matKhau = taoMatKhauTam();
    const u = them('nguoidung', {
      tenDangNhap: ten,
      matKhau: matKhau,
      vaiTro: o.vaiTro,
      hoTen: o.hoTen,
      hoSoId: o.hoSoId,
      loaiHoSo: o.loaiHoSo,
      trangThai: 'hoatdong',
      phaiDoiMatKhau: false,
      ngayTao: _homNay()
    });
    return { ok: true, nguoidung: u, matKhau: matKhau };
  }

  /* Đặt lại mật khẩu: Supabase đặt trực tiếp, localStorage sinh mật khẩu tạm.
     Trả về mật khẩu mới để chủ trọ gửi cho người dùng. */
  async function datLaiMatKhau(userId) {
    if (cheDoSupabase) {
      const user = tim('nguoidung', userId);
      if (!user) throw new Error('Không tìm thấy tài khoản.');
      const matKhau = taoMatKhauTam();
      const result = await goiHamInviteUser({ action: 'reset-password', profile_id: userId, password: matKhau });
      if (result.error) {
        let loi = result.error.message;
        try {
          const body = await result.error.context.json();
          if (body && body.error) loi = body.error;
        } catch (e) { /* giữ thông báo mặc định */ }
        throw new Error(loi);
      }
      sua('nguoidung', userId, { phaiDoiMatKhau: false, trangThai: 'hoatdong' });
      return (result.data && result.data.password) || matKhau;
    }
    const matKhau = taoMatKhauTam();
    sua('nguoidung', userId, { matKhau: matKhau, phaiDoiMatKhau: false, trangThai: 'hoatdong' });
    return matKhau;
  }

  async function guiEmailDatLai(email) {
    if (!cheDoSupabase) throw new Error('Gửi email đặt lại mật khẩu chỉ dùng với Supabase.');
    loiSupabase(await supabaseClient.auth.resetPasswordForEmail(String(email || '').trim().toLowerCase(), {
      redirectTo: new URL('datlaimatkhau.html', location.href).toString()
    }));
  }

  function khoaTaiKhoan(userId, khoa) {
    return sua('nguoidung', userId, { trangThai: khoa ? 'khoa' : 'hoatdong' });
  }

  async function dangNhap(tenDangNhap, matKhau, ghiNho) {
    if (cheDoSupabase) {
      const ketQua = await supabaseClient.auth.signInWithPassword({
        email: String(tenDangNhap || '').trim().toLowerCase(),
        password: matKhau
      });
      if (ketQua.error) return { ok: false, loi: 'Email hoặc mật khẩu không đúng.' };
      try {
        const user = await napNguoiDung(ketQua.data.user);
        return { ok: true, nguoidung: user };
      } catch (loi) {
        await supabaseClient.auth.signOut();
        return { ok: false, loi: loi.message || 'Tài khoản chưa được cấu hình trong hệ thống.' };
      }
    }
    const ten = String(tenDangNhap || '').trim().toLowerCase();
    const u = lay('nguoidung').find(function (x) {
      return String(x.tenDangNhap).toLowerCase() === ten;
    });
    if (!u || u.matKhau !== matKhau) {
      return { ok: false, loi: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    }
    if (u.trangThai === 'khoa') {
      return { ok: false, loi: 'Tài khoản đã bị khóa, vui lòng liên hệ chủ trọ.' };
    }
    if (u.vaiTro === 'quanly' && !coSoCuaNguoiDung(u)) {
      return { ok: false, loi: 'Tài khoản quản lý chưa được phân công cơ sở, vui lòng liên hệ chủ trọ.' };
    }
    const goi = JSON.stringify({ userId: u.id, luc: Date.now() });
    try {
      if (ghiNho) {
        localStorage.setItem(KHOA_PHIEN, goi);
        sessionStorage.removeItem(KHOA_PHIEN_TAM);
      } else {
        sessionStorage.setItem(KHOA_PHIEN_TAM, goi);
        localStorage.removeItem(KHOA_PHIEN);
      }
    } catch (e) {
      console.error(e);
    }
    return { ok: true, nguoidung: u };
  }

  /* Người đang đăng nhập (null nếu chưa đăng nhập hoặc bị khóa) */
  function phien() {
    if (cheDoSupabase) return nguoiDungHienTai;
    try {
      const raw = sessionStorage.getItem(KHOA_PHIEN_TAM) || localStorage.getItem(KHOA_PHIEN);
      if (!raw) return null;
      const goi = JSON.parse(raw);
      const u = tim('nguoidung', goi.userId);
      if (!u || u.trangThai !== 'hoatdong') return null;
      return u;
    } catch (e) {
      return null;
    }
  }

  async function dangXuat() {
    ngatTheoDoi();
    if (cheDoSupabase && supabaseClient) {
      const ketQua = await supabaseClient.auth.signOut();
      if (ketQua.error) throw ketQua.error;
      nguoiDungHienTai = null;
      profileHienTai = null;
      boNho = khoDuLieuTrong();
      return;
    }
    localStorage.removeItem(KHOA_PHIEN);
    sessionStorage.removeItem(KHOA_PHIEN_TAM);
  }

  async function doiMatKhau(userId, matKhauMoi) {
    if (cheDoSupabase) {
      loiSupabase(await supabaseClient.auth.updateUser({ password: matKhauMoi }));
      loiSupabase(await supabaseClient.rpc('update_profile_settings', {
        p_profile_id: userId,
        p_must_change_password: false
      }));
      const user = (boNho.nguoidung || []).find(function (x) { return x.id === userId; });
      if (user) user.phaiDoiMatKhau = false;
      if (nguoiDungHienTai) nguoiDungHienTai.phaiDoiMatKhau = false;
      return nguoiDungHienTai;
    }
    return sua('nguoidung', userId, { matKhau: matKhauMoi, phaiDoiMatKhau: false });
  }

  async function capNhatMatKhauTuLienKet(matKhauMoi) {
    if (!cheDoSupabase) throw new Error('Liên kết đặt lại mật khẩu chỉ dùng với Supabase.');
    loiSupabase(await supabaseClient.auth.updateUser({ password: matKhauMoi }));
    const user = await supabaseClient.auth.getUser();
    if (user.error) throw user.error;
    if (!user.data.user) throw new Error('Liên kết đặt lại mật khẩu đã hết hạn.');
    loiSupabase(await supabaseClient.rpc('update_profile_settings', {
      p_profile_id: user.data.user.id,
      p_must_change_password: false
    }));
    await napNguoiDung(user.data.user);
  }

  async function xacThucMatKhau(userId, matKhauHienTai) {
    if (!cheDoSupabase) {
      const user = tim('nguoidung', userId);
      return !!user && user.matKhau === matKhauHienTai;
    }

    const user = await supabaseClient.auth.getUser();
    if (user.error) throw user.error;
    if (!user.data.user || user.data.user.id !== userId) return false;
    const ketQua = await supabaseClient.auth.signInWithPassword({
      email: user.data.user.email,
      password: matKhauHienTai
    });
    if (ketQua.error) return false;
    await napNguoiDung(ketQua.data.user);
    return true;
  }

  async function ghiBoDuLieuVaoSupabase(duLieu) {
    if (!cheDoSupabase || !profileHienTai || profileHienTai.role !== 'owner') {
      throw new Error('Chỉ chủ trọ đang đăng nhập mới có thể nạp dữ liệu.');
    }
    const ownerId = profileHienTai.id;
    const existing = await supabaseClient.from('app_records')
      .select('record_id', { count: 'exact', head: true }).eq('owner_id', ownerId);
    loiSupabase(existing);
    if (existing.count > 0) throw new Error('Supabase đã có dữ liệu; không nạp chồng dữ liệu.');

    const bangTheoThuTu = [
      'coso', 'phong', 'nhanvien', 'khach', 'hopdong', 'hoadon', 'chiso',
      'thanhtoan', 'suco', 'thongbao', 'chiphi', 'dichvu'
    ];
    const daChen = [];
    let soNhap = 0;
    try {
      for (const bang of bangTheoThuTu) {
        const hang = Array.isArray(duLieu[bang]) ? duLieu[bang] : [];
        if (!hang.length) continue;
        const rows = hang.map(function (item) {
          return {
            owner_id: ownerId,
            table_name: bang,
            record_id: String(item.id),
            payload: item
          };
        });
        loiSupabase(await supabaseClient.from('app_records').insert(rows));
        daChen.push({ bang: bang, ids: rows.map(function (row) { return row.record_id; }) });
        soNhap += rows.length;
      }
    } catch (loi) {
      const loiHoanTac = [];
      for (const muc of daChen.reverse()) {
        const ketQua = await supabaseClient.from('app_records').delete()
          .eq('owner_id', ownerId).eq('table_name', muc.bang).in('record_id', muc.ids);
        if (ketQua.error) loiHoanTac.push(ketQua.error.message);
      }
      if (loiHoanTac.length) {
        throw new Error('Nạp dữ liệu thất bại: ' + (loi.message || loi) +
          '. Không thể hoàn tác toàn bộ bản ghi: ' + loiHoanTac.join('; '));
      }
      throw loi;
    }

    await napNguoiDung({ id: ownerId });
    return soNhap;
  }

  return {
    lay: lay, tim: tim, them: them, sua: sua, xoa: xoa, xoaTaiKhoan: xoaTaiKhoan,
    giaTriDaTonTai: giaTriDaTonTai, soBanGhiToanBo: soBanGhiToanBo,
    hopDongHieuLuc: hopDongHieuLuc, hopDongCuaKhach: hopDongCuaKhach,
    hoaDonTrongKy: hoaDonTrongKy, daThu: daThu, conNo: conNo,
    trangThaiHoaDon: trangThaiHoaDon, cotKanban: cotKanban,
    dongBoPhong: dongBoPhong, tinhTong: tinhTong,
    goiYChiSo: goiYChiSo, luuChiSo: luuChiSo,
    nguoiDungCuaHoSo: nguoiDungCuaHoSo, tenDangNhapTuHoSo: tenDangNhapTuHoSo,
    capTaiKhoan: capTaiKhoan, datLaiMatKhau: datLaiMatKhau, guiEmailDatLai: guiEmailDatLai,
    khoaTaiKhoan: khoaTaiKhoan,
    dangNhap: dangNhap, phien: phien, dangXuat: dangXuat, doiMatKhau: doiMatKhau,
    xacThucMatKhau: xacThucMatKhau,
    capNhatMatKhauTuLienKet: capNhatMatKhauTuLienKet,
    coSoCuaPhien: coSoCuaPhien, khoiTao: khoiTao, choGhiXong: function () { return hangDoiGhi; },
    taiLaiDuLieu: taiLaiDuLieu, batDauTheoDoi: batDauTheoDoi, ngatTheoDoi: ngatTheoDoi,
    tangLuotMoHoaDon: tangLuotMoHoaDon,
    cheDoSupabase: cheDoSupabase
  };
})();

DL.sanSang = DL.khoiTao();

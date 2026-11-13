/* ============================================================
   dangnhap.js — Đăng nhập, hiện/ẩn mật khẩu, ghi nhớ phiên,
   tạo tài khoản chủ trọ đầu tiên và chuyển trang theo vai trò.
   ============================================================ */

/* Đọc tham số "tiep" và chỉ chấp nhận đường dẫn nội bộ hợp lệ.
   Ví dụ: khachthue.html?hoadon=h1011 */
function layThamSoTiep() {
  let raw = '';
  try {
    raw = new URLSearchParams(location.search).get('tiep') || '';
  } catch (e) {
    return '';
  }
  raw = raw.trim();
  if (!raw) return '';

  /* Chặn đường dẫn tuyệt đối, giao thức lạ và thoát thư mục */
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) return '';
  if (raw.indexOf('..') !== -1 || raw.indexOf('\\') !== -1) return '';
  raw = raw.replace(/^\/+/, '').replace(/^html\//i, '');

  if (!/^(admin|quanly|khachthue)\.html(?:\?[^#\s]*)?(?:#[^\s]*)?$/i.test(raw)) return '';
  return raw;
}

/* Chọn trang đích: giữ link "tiep" nếu đúng vai trò, ngược lại về trang vai trò */
function trangDich(nguoiDung) {
  const trangVaiTro = TRANG_THEO_VAI_TRO[nguoiDung.vaiTro];
  const tiep = layThamSoTiep();
  if (tiep && trangVaiTro) {
    const tenFile = tiep.split(/[?#]/)[0].toLowerCase();
    if (tenFile === trangVaiTro.toLowerCase()) return tiep;
  }
  return trangVaiTro || '../index.html';
}

/* Hiện hoặc ẩn hộp lỗi */
function hienLoiDangNhap(chu) {
  const o = document.getElementById('loiDangNhap');
  if (!o) return;
  o.textContent = chu;
  o.hidden = false;
}

function anLoiDangNhap() {
  const o = document.getElementById('loiDangNhap');
  if (o) o.hidden = true;
}

/* Nếu đã có phiên, hiện bảng tiếp tục thay cho biểu mẫu */
function hienPhienDangNhap() {
  const phien = DL.phien();
  if (!phien) return;

  const bang = document.getElementById('phienBang');
  const khoiForm = document.getElementById('khoiForm');
  if (!bang || !khoiForm) return;

  const chu = (phien.hoTen || '?').trim().charAt(0).toUpperCase();
  document.getElementById('phienChu').textContent = chu;
  document.getElementById('phienTen').textContent = phien.hoTen || phien.tenDangNhap;
  document.getElementById('phienVaiTro').textContent =
    (TEN_VAI_TRO[phien.vaiTro] || 'Người dùng') + ' · ' + phien.tenDangNhap;
  document.getElementById('nutTiepTuc').href = trangDich(phien);

  bang.hidden = false;
  khoiForm.hidden = true;
}

/* Gắn sự kiện hiện/ẩn mật khẩu */
function ganHienMatKhau() {
  const o = document.getElementById('matKhau');
  const nut = document.getElementById('nutHienMatKhau');
  if (!o || !nut) return;

  nut.addEventListener('click', function () {
    const dangHien = o.type === 'text';
    o.type = dangHien ? 'password' : 'text';
    nut.textContent = dangHien ? 'Hiện' : 'Ẩn';
    nut.setAttribute('aria-pressed', String(!dangHien));
    o.focus();
  });
}

/* Gắn sự kiện cho nút quên mật khẩu */
function ganQuenMatKhau() {
  const nut = document.getElementById('quenMatKhau');
  if (!nut) return;

  nut.addEventListener('click', function () {
    if (DL.cheDoSupabase) {
      const email = window.prompt('Nhập email tài khoản để nhận liên kết đặt lại mật khẩu:');
      if (!email) return;
      DL.guiEmailDatLai(email).then(function () {
        thongBao('Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu sẽ được gửi.');
      }).catch(function (loi) {
        console.error('Gửi email đặt lại mật khẩu thất bại:', loi);
        hienLoiDangNhap('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
      });
      return;
    }
    moHop({
      tieuDe: 'Quên mật khẩu?',
      moTa: 'Hệ thống không tự gửi email đặt lại mật khẩu.',
      noiDung:
        '<p class="chu-mo">Vui lòng liên hệ chủ trọ hoặc quản lý nhà trọ để được ' +
        'đặt lại mật khẩu tạm. Bạn sẽ dùng mật khẩu tạm để đăng nhập.</p>' +
        '<p class="ghi-chu-nho">Mật khẩu mới cần có ít nhất 8 ký tự và không trùng mật khẩu tạm.</p>',
      chanTrang: '<button class="nut nut--chinh" data-dong>Đã hiểu</button>'
    });
  });
}

/* Tạo tài khoản chủ trọ đầu tiên khi chạy chế độ localStorage */
function ganKhoiTaoChuTro() {
  if (DL.cheDoSupabase) return;
  const khoi = document.getElementById('khoiTaoChuTro');
  const form = document.getElementById('formKhoiTao');
  if (!khoi || !form) return;
  if (DL.lay('nguoidung').length) return;

  const khoiForm = document.getElementById('khoiForm');
  if (khoiForm) khoiForm.hidden = true;
  khoi.hidden = false;

  const nutThu = document.getElementById('nutThuTuDangNhap');
  if (nutThu) {
    nutThu.onclick = async function () {
      const dongY = await hoi('Nạp bộ dữ liệu thử?', 'Tạo bộ dữ liệu mẫu kèm tài khoản chủ trọ, quản lý và khách thuê để đăng nhập thử.', 'Nạp dữ liệu thử');
      if (!dongY) return;
      nutThu.disabled = true;
      try {
        DL.napBoDuLieuThu();
        location.reload();
      } catch (loi) {
        console.error('Nạp dữ liệu thử thất bại:', loi);
        thongBao(loi.message || 'Không thể nạp dữ liệu thử.', 'loi');
        nutThu.disabled = false;
      }
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const hoTen = giaTri('ktHoTen').trim();
    const ten = giaTri('ktTenDangNhap').trim().toLowerCase();
    const matKhau = giaTri('ktMatKhau');
    const lai = giaTri('ktMatKhauLai');
    const loi = document.getElementById('loiKhoiTao');
    function baoLoi(chu) { loi.hidden = false; loi.textContent = chu; }
    loi.hidden = true;

    if (!hoTen) return baoLoi('Vui lòng nhập họ tên chủ trọ.');
    if (!ten) return baoLoi('Vui lòng nhập tên đăng nhập.');
    if (matKhau.length < 8) return baoLoi('Mật khẩu phải có ít nhất 8 ký tự.');
    if (matKhau !== lai) return baoLoi('Hai lần nhập mật khẩu không khớp.');

    DL.them('nguoidung', {
      tenDangNhap: ten,
      matKhau: matKhau,
      vaiTro: 'admin',
      hoTen: hoTen,
      hoSoId: null,
      loaiHoSo: null,
      trangThai: 'hoatdong',
      phaiDoiMatKhau: false,
      ngayTao: _homNay()
    });

    document.getElementById('tenDangNhap').value = ten;
    document.getElementById('matKhau').value = matKhau;
    khoi.hidden = true;
    if (khoiForm) khoiForm.hidden = false;
    thongBao('Đã tạo tài khoản chủ trọ. Bấm Đăng nhập để tiếp tục.');
    const nut = document.getElementById('nutDangNhap');
    if (nut) nut.focus();
  });
}

/* Điền nhanh tài khoản thử khi đã nạp bộ dữ liệu thử */
function ganTaiKhoanThu() {
  if (DL.cheDoSupabase) return;
  const khoi = document.getElementById('taiKhoanThu');
  if (!khoi) return;
  const coDuLieuThu = DL.lay('nguoidung').some(function (u) {
    return u.tenDangNhap === 'admin@ancu.vn';
  });
  if (!coDuLieuThu) return;

  khoi.hidden = false;
  document.querySelectorAll('[data-ten][data-mat-khau]').forEach(function (nut) {
    nut.addEventListener('click', function () {
      document.getElementById('tenDangNhap').value = nut.dataset.ten;
      document.getElementById('matKhau').value = nut.dataset.matKhau;
      anLoiDangNhap();
      document.getElementById('nutDangNhap').focus();
      thongBao('Đã điền tài khoản thử. Bấm Đăng nhập để tiếp tục.');
    });
  });
}

/* Xử lý gửi biểu mẫu đăng nhập */
function ganDangNhap() {
  const form = document.getElementById('formDangNhap');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    anLoiDangNhap();

    const ten = giaTri('tenDangNhap');
    const matKhau = giaTri('matKhau');
    if (!ten) { hienLoiDangNhap('Vui lòng nhập tên đăng nhập.'); return; }
    if (!matKhau) { hienLoiDangNhap('Vui lòng nhập mật khẩu.'); return; }

    const ghiNho = document.getElementById('ghiNho');
    let ketQua;
    try {
      ketQua = await DL.dangNhap(ten, matKhau, ghiNho ? ghiNho.checked : false);
    } catch (loi) {
      console.error('Đăng nhập Supabase thất bại:', loi);
      hienLoiDangNhap('Không kết nối được máy chủ. Vui lòng thử lại.');
      return;
    }

    if (!ketQua.ok) {
      hienLoiDangNhap(ketQua.loi);
      const oMatKhau = document.getElementById('matKhau');
      if (oMatKhau) oMatKhau.select();
      return;
    }

    const nut = document.getElementById('nutDangNhap');
    if (nut) {
      nut.disabled = true;
      nut.textContent = 'Đang mở…';
    }
    thongBao('Đăng nhập thành công. Đang mở trang…');
    const dich = trangDich(ketQua.nguoidung);
    setTimeout(function () { location.replace(dich); }, 260);
  });

  ['tenDangNhap', 'matKhau'].forEach(function (id) {
    const o = document.getElementById(id);
    if (o) o.addEventListener('input', anLoiDangNhap);
  });
}

/* Xử lý bảng phiên đăng nhập sẵn có */
function ganPhienDangNhap() {
  const nutDangXuat = document.getElementById('nutDangXuatPhien');
  if (nutDangXuat) {
    nutDangXuat.addEventListener('click', function () {
      hoi('Đăng xuất?', 'Bạn sẽ quay lại biểu mẫu đăng nhập.', 'Đăng xuất').then(function (dongY) {
        if (!dongY) return;
        DL.dangXuat().then(function () { location.reload(); }).catch(function (loi) {
          console.error('Đăng xuất thất bại:', loi);
          hienLoiDangNhap('Không thể đăng xuất khỏi Supabase. Vui lòng thử lại.');
        });
      });
    });
  }

  const nutDoi = document.getElementById('nutDoiTaiKhoan');
  if (nutDoi) {
    nutDoi.addEventListener('click', function () {
      DL.dangXuat().then(function () { location.reload(); }).catch(function (loi) {
        console.error('Đăng xuất thất bại:', loi);
        hienLoiDangNhap('Không thể đăng xuất khỏi Supabase. Vui lòng thử lại.');
      });
    });
  }
}

/* Khởi động trang đăng nhập */
document.addEventListener('DOMContentLoaded', function () {
  DL.sanSang.then(function () {
    ganHienMatKhau();
    ganQuenMatKhau();
    ganKhoiTaoChuTro();
    ganTaiKhoanThu();
    ganDangNhap();
    ganPhienDangNhap();
    hienPhienDangNhap();

    if (!DL.phien()) {
      const o = document.getElementById('tenDangNhap');
      if (o) o.focus();
    }
  }).catch(function (loi) {
    console.error('Khởi tạo Supabase thất bại:', loi);
    hienLoiDangNhap('Không thể kết nối Supabase. Kiểm tra cấu hình Project URL/key và thử lại.');
  });
});

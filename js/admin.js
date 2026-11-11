/* ============================================================
   admin.js — Trang chủ trọ: tổng quan, nhân viên, giá dịch vụ,
   báo cáo doanh thu, công nợ, chi phí và các màn hình dùng chung.
   ============================================================ */

const MENU_ADMIN = [
  { nhom: 'Tổng quan', muc: [{ id: 'tongquan', ten: 'Tổng quan' }] },
  { nhom: 'Vận hành', muc: [
    { id: 'phong', ten: 'Phòng' },
    { id: 'khach', ten: 'Khách thuê' },
    { id: 'hopdong', ten: 'Hợp đồng' },
    { id: 'suco', ten: 'Sự cố' }
  ] },
  { nhom: 'Tài chính', muc: [
    { id: 'hoadon', ten: 'Hóa đơn' },
    { id: 'congno', ten: 'Công nợ' },
    { id: 'baocao', ten: 'Báo cáo doanh thu' },
    { id: 'chiphi', ten: 'Chi phí' },
    { id: 'dichvu', ten: 'Giá dịch vụ' }
  ] },
  { nhom: 'Hệ thống', muc: [
    { id: 'coso', ten: 'Cơ sở' },
    { id: 'nhansu', ten: 'Nhân viên' },
    { id: 'thongbao', ten: 'Thông báo' },
    { id: 'taikhoan', ten: 'Tài khoản' }
  ] }
];

const QUYEN_ADMIN = {
  xoaPhong: true, xoaKhach: true, hopDongDayDu: true,
  huyHoaDon: true, xoaHoaDon: true, taoSuCo: false,
  khoiPhucDuLieu: true
};

/* ============================================================
   TỔNG QUAN
   ============================================================ */

function manTongQuan() {
  const phong = DL.lay('phong');
  const khach = DL.lay('khach');
  const nhanvien = DL.lay('nhanvien');
  const hoadon = DL.lay('hoadon');
  const thang = thangNay();

  const soDangThue = phong.filter(function (p) { return p.trangThai === 'dangthue'; }).length;
  const soTrong = phong.filter(function (p) { return p.trangThai === 'trong'; }).length;
  const soKhach = khach.filter(function (k) { return k.trangThai === 'dangthue'; }).length;
  const thuThang = DL.lay('thanhtoan').filter(function (t) { return thangCua(t.ngay) === thang; })
    .reduce(function (t, x) { return t + (Number(x.soTien) || 0); }, 0);
  const congNo = hoadon.filter(function (h) { return h.trangThai !== 'huy'; })
    .reduce(function (t, h) { return t + DL.conNo(h); }, 0);
  const suCoMoi = DL.lay('suco').filter(function (sc) { return sc.trangThai !== 'hoanthanh'; }).length;

  const ganDay = hoadon.slice().sort(function (a, b) {
    if (a.ky !== b.ky) return a.ky < b.ky ? 1 : -1;
    return a.ma.localeCompare(b.ma);
  }).slice(0, 5);

  const dong = ganDay.map(function (h) {
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    const tt = DL.trangThaiHoaDon(h);
    return [
      '<strong>' + thoat(h.ma) + '</strong>',
      kyDep(h.ky),
      p ? thoat(p.ma) : '—',
      k ? thoat(k.hoTen) : '—',
      '<span class="so">' + tien(h.tong) + '</span>',
      '<span class="so">' + tien(tt.daThu) + '</span>',
      nhanHoaDon(h)
    ];
  });

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Tổng quan', 'Tình hình nhà trọ trong tháng ' + kyDep(thang) + '.',
        '<button class="nut nut--chinh" data-di="hoadon">Lập hóa đơn</button>') +
      luoiThongKe([
        { nhan: 'Cơ sở', so: DL.lay('coso').length, ghiChu: 'Mỗi cơ sở có một quản lý' },
        { nhan: 'Tổng phòng', so: phong.length, ghiChu: soDangThue + ' đang thuê · ' + soTrong + ' trống' },
        { nhan: 'Khách đang thuê', so: soKhach, ghiChu: 'Tổng ' + khach.length + ' hồ sơ khách' },
        { nhan: 'Nhân viên', so: nhanvien.length, ghiChu: 'Quản lý, kế toán, kỹ thuật' },
        { nhan: 'Đã thu tháng này', so: tien(thuThang), lop: 'thong-ke__so--la' },
        { nhan: 'Tổng công nợ', so: tien(congNo), lop: 'thong-ke__so--do' },
        { nhan: 'Sự cố chưa xong', so: suCoMoi, ghiChu: 'Mới và đang xử lý', lop: suCoMoi ? 'thong-ke__so--do' : '' }
      ], 'luoi-thong-ke--tongquan') +
      '<div class="luoi luoi--3" style="margin-top:6px">' +
        '<div class="the"><div class="the__dau"><div><h3>Phòng</h3><p>' + phong.length + ' phòng · ' + soTrong + ' còn trống</p></div></div>' +
          '<button class="nut nut--ngoc nut--nho" data-di="phong">Xem danh sách</button></div>' +
        '<div class="the"><div class="the__dau"><div><h3>Khách thuê</h3><p>' + soKhach + ' khách đang thuê</p></div></div>' +
          '<button class="nut nut--ngoc nut--nho" data-di="khach">Xem hồ sơ</button></div>' +
        '<div class="the"><div class="the__dau"><div><h3>Hợp đồng</h3><p>' + DL.lay('hopdong').filter(function (h) { return h.trangThai === 'hieuluc'; }).length + ' hợp đồng hiệu lực</p></div></div>' +
          '<button class="nut nut--ngoc nut--nho" data-di="hopdong">Quản lý</button></div>' +
        '<div class="the"><div class="the__dau"><div><h3>Hóa đơn</h3><p>' + hoadon.filter(function (h) { return h.trangThai !== 'huy'; }).length + ' hóa đơn đã lập</p></div></div>' +
          '<button class="nut nut--ngoc nut--nho" data-di="hoadon">Xem hóa đơn</button></div>' +
        '<div class="the"><div class="the__dau"><div><h3>Chi phí</h3><p>Tổng chi tháng này</p></div></div>' +
          '<button class="nut nut--ngoc nut--nho" data-di="chiphi">Ghi chi phí</button></div>' +
        '<div class="the"><div class="the__dau"><div><h3>Báo cáo</h3><p>Doanh thu và công nợ</p></div></div>' +
          '<button class="nut nut--ngoc nut--nho" data-di="baocao">Mở báo cáo</button></div>' +
      '</div>' +
      '<div class="the" style="margin-top:24px">' +
        '<div class="the__dau"><div><h3>Hóa đơn gần đây</h3><p>Năm hóa đơn mới nhất của nhà trọ</p></div></div>' +
        bangHtml(['Mã', 'Kỳ', 'Phòng', 'Khách', 'Tổng', 'Đã thu', 'Trạng thái'], dong, 7) +
      '</div>' +
    '</div>';

  khu.onclick = function (e) {
    const b = e.target.closest('[data-di]');
    if (b) chuyenManHinh(b.dataset.di);
  };
}

/* ============================================================
   NHÂN VIÊN
   ============================================================ */

let timNhanVien = '';

function manNhanVien() {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Nhân viên', 'Hồ sơ nhân sự, chức vụ, khu vực phụ trách và tài khoản quản lý.',
        '<button class="nut nut--chinh" id="themNhanVien">Thêm nhân viên</button>') +
      '<div class="toolbar"><div class="toolbar__trai">' +
        oTim('timNhanVien', 'Tìm họ tên, SĐT, email…', timNhanVien) +
      '</div><span class="dem" id="demNhanVien"></span></div>' +
      '<div id="khuNhanVien"></div>' +
    '</div>';
  veNhanVien();
  document.getElementById('themNhanVien').onclick = function () {
    moFormNhanVien(null, veNhanVien);
  };
  ganTim('timNhanVien', function (v) { timNhanVien = v; veNhanVien(); });
}

function veNhanVien() {
  const khu = document.getElementById('khuNhanVien');
  if (!khu) return;
  const tatCa = DL.lay('nhanvien');
  const tim = timNhanVien.toLowerCase();
  const ds = tatCa.filter(function (nv) {
    if (!tim) return true;
    return (nv.hoTen + ' ' + nv.sdt + ' ' + nv.email + ' ' + nv.chucVu).toLowerCase().indexOf(tim) >= 0;
  });

  const soCoTk = tatCa.filter(function (nv) { return taiKhoanCuaNhanVien(nv); }).length;
  const soHoatDong = tatCa.filter(function (nv) {
    const u = taiKhoanCuaNhanVien(nv);
    return u && u.trangThai === 'hoatdong';
  }).length;

  const dong = ds.map(function (nv) {
    const u = taiKhoanCuaNhanVien(nv);
    return [
      '<strong>' + thoat(nv.ma) + '</strong>',
      thoat(nv.hoTen),
      thoat(nv.sdt),
      thoat(nv.email) || '<span class="phu">—</span>',
      thoat(nv.chucVu),
      thoat(nv.khuVuc),
      nhanTaiKhoan(u),
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-sua="' + nv.id + '">Sửa</button>' +
        '<button class="nut nut--ngoc nut--nho" data-tk="' + nv.id + '">Tài khoản</button>' +
        '<button class="nut nut--xoa" data-xoa="' + nv.id + '">Xóa</button>' +
      '</div>'
    ];
  });

  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Tổng nhân viên', so: tatCa.length },
      { nhan: 'Đã cấp tài khoản', so: soCoTk, lop: 'thong-ke__so--xanh' },
      { nhan: 'Đang hoạt động', so: soHoatDong, lop: 'thong-ke__so--la' },
      { nhan: 'Chưa cấp tài khoản', so: tatCa.length - soCoTk, lop: 'thong-ke__so--do' }
    ]) +
    bangHtml(['Mã', 'Họ tên', 'SĐT', 'Email', 'Chức vụ', 'Khu vực', 'Tài khoản', ''], dong);

  const oDem = document.getElementById('demNhanVien');
  if (oDem) oDem.textContent = ds.length + ' nhân viên';

  khu.onclick = function (e) {
    const sua = e.target.closest('[data-sua]');
    const tk = e.target.closest('[data-tk]');
    const xoa = e.target.closest('[data-xoa]');
    if (sua) moFormNhanVien(DL.tim('nhanvien', sua.dataset.sua), veNhanVien);
    if (tk) moTaiKhoanNhanVien(DL.tim('nhanvien', tk.dataset.tk), veNhanVien);
    if (xoa) xoaNhanVien(xoa.dataset.xoa, veNhanVien);
  };
}

function moFormNhanVien(nv, xong) {
  const laSua = !!nv;
  moHop({
    tieuDe: laSua ? 'Sửa nhân viên' : 'Thêm nhân viên',
    moTa: 'Email là tên đăng nhập của tài khoản quản lý. Có thể cấp tài khoản sau khi lưu.',
    noiDung:
      '<form class="bieu-mau" id="formNhanVien">' +
        '<div class="luoi-nhap">' +
          '<div class="nhom"><label for="nvHoTen">Họ tên *</label><input id="nvHoTen" class="o-nhap" value="' + thoat(laSua ? nv.hoTen : '') + '"></div>' +
          '<div class="nhom"><label for="nvSdt">Số điện thoại *</label><input id="nvSdt" class="o-nhap" value="' + thoat(laSua ? nv.sdt : '') + '"></div>' +
          '<div class="nhom"><label for="nvEmail">Email (tên đăng nhập) *</label><input id="nvEmail" type="email" class="o-nhap" value="' + thoat(laSua ? nv.email : '') + '"></div>' +
          '<div class="nhom"><label for="nvChucVu">Chức vụ</label><select id="nvChucVu" class="o-chon">' +
            ['Quản lý cơ sở', 'Kế toán', 'Kỹ thuật'].map(function (c) {
              return '<option' + (laSua && nv.chucVu === c ? ' selected' : '') + '>' + c + '</option>';
            }).join('') +
          '</select></div>' +
          '<div class="nhom"><label for="nvKhuVuc">Khu vực phụ trách</label><input id="nvKhuVuc" class="o-nhap" value="' + thoat(laSua ? nv.khuVuc : 'Khu A') + '"></div>' +
          '<div class="nhom"><label for="nvNgayVao">Ngày vào làm</label><input id="nvNgayVao" type="date" class="o-nhap" value="' + thoat(laSua ? nv.ngayVao : homNay()) + '"></div>' +
        '</div>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuNhanVien">' + (laSua ? 'Lưu thay đổi' : 'Thêm nhân viên') + '</button>'
  });

  document.getElementById('luuNhanVien').onclick = function () {
    const hoTen = giaTri('nvHoTen');
    const sdt = giaTri('nvSdt');
    const email = giaTri('nvEmail').toLowerCase();
    if (!hoTen || !sdt || !email) { thongBao('Vui lòng nhập họ tên, SĐT và email.', 'loi'); return; }
    if (DL.lay('nhanvien').some(function (x) { return x.email.toLowerCase() === email && (!laSua || x.id !== nv.id); })) {
      thongBao('Email này đã được dùng cho nhân viên khác.', 'loi'); return;
    }
    const chucVu = giaTri('nvChucVu');
    if (laSua && chucVu !== nv.chucVu && DL.lay('coso').some(function (c) { return c.quanLyId === nv.id; })) {
      thongBao('Hãy phân công lại cơ sở trước khi đổi chức vụ quản lý.', 'loi');
      return;
    }
    const du = {
      hoTen: hoTen, sdt: sdt, email: email,
      chucVu: chucVu, khuVuc: giaTri('nvKhuVuc'), ngayVao: giaTri('nvNgayVao')
    };
    if (laSua) {
      DL.sua('nhanvien', nv.id, du);
      const u = taiKhoanCuaNhanVien(nv);
      if (u) DL.sua('nguoidung', u.id, { hoTen: hoTen, tenDangNhap: email });
      thongBao('Đã cập nhật nhân viên.');
    } else {
      du.ma = 'NV-' + String(DL.lay('nhanvien').length + 1).padStart(3, '0');
      DL.them('nhanvien', du);
      thongBao('Đã thêm nhân viên.');
    }
    dongHop();
    if (xong) xong();
  };
}

function moTaiKhoanNhanVien(nv, xong) {
  if (!nv) return;
  const u = taiKhoanCuaNhanVien(nv);
  const ten = u ? u.tenDangNhap : nv.email;
  if (!u && nv.chucVu !== 'Quản lý cơ sở') {
    moHop({
      tieuDe: 'Chỉ quản lý cơ sở có tài khoản vận hành',
      noiDung: '<p class="chu-mo">Hãy đổi chức vụ thành “Quản lý cơ sở” trước khi cấp tài khoản quản lý.</p>',
      chanTrang: '<button class="nut nut--ngoc" data-dong>Đóng</button>'
    });
    return;
  }

  const lamMoi = function () {
    if (xong) xong();
    moTaiKhoanNhanVien(DL.tim('nhanvien', nv.id), xong);
  };

  moHop({
    tieuDe: 'Tài khoản của ' + thoat(nv.hoTen),
    moTa: 'Tài khoản quản lý chỉ thao tác trong phạm vi được giao.',
    noiDung:
      '<div class="the-tai-khoan">' +
        '<div><h4>Tên đăng nhập</h4><p class="ma-don">' + thoat(ten) + '</p>' +
        '<p>Trạng thái: ' + nhanTaiKhoan(u) + '</p></div>' +
        (u ? '<div><h4>Mật khẩu</h4><p>' + (u.phaiDoiMatKhau ? 'Đang dùng mật khẩu tạm' : 'Nhân viên đã tự đổi mật khẩu') + '</p></div>' : '') +
      '</div>' +
      '<p class="ghi-chu-nho">' + (DL.cheDoSupabase
        ? 'Tài khoản Supabase được kích hoạt qua liên kết gửi tới email.'
        : 'Mật khẩu tạm chỉ hiển thị một lần và bắt buộc đổi ở lần đăng nhập đầu tiên.') + '</p>',
    chanTrang:
      (u
        ? '<button class="nut nut--ngoc" data-dong>Đóng</button>' +
          '<button class="nut nut--ngoc" id="nvKhoa">' + (u.trangThai === 'khoa' ? 'Mở khóa' : 'Khóa tài khoản') + '</button>' +
          '<button class="nut nut--chinh" id="nvDatLai">Đặt lại mật khẩu</button>'
        : '<button class="nut nut--ngoc" data-dong>Đóng</button>' +
          '<button class="nut nut--chinh" id="nvCap">Cấp tài khoản</button>')
  });

  if (!u) {
    document.getElementById('nvCap').onclick = async function () {
      try {
        const kq = await DL.capTaiKhoan({
          hoTen: nv.hoTen, email: nv.email, sdt: nv.sdt,
          hoSoId: nv.id, loaiHoSo: 'nhanvien', vaiTro: 'quanly'
        });
        if (!kq.ok) { thongBao(kq.loi, 'loi'); return; }
        if (kq.invited) {
          thongBao('Đã gửi email mời đăng nhập tới ' + nv.email + '.');
          if (xong) xong();
          return;
        }
        hienMatKhauTam(kq.nguoidung.tenDangNhap, kq.matKhau, nv.hoTen, lamMoi);
      } catch (loi) {
        console.error('Cấp tài khoản quản lý thất bại:', loi);
        thongBao('Không thể gửi lời mời Supabase. Vui lòng thử lại.', 'loi');
      }
    };
    return;
  }

  document.getElementById('nvDatLai').onclick = async function () {
    const dongY = await hoi('Đặt lại mật khẩu?', DL.cheDoSupabase
      ? 'Một liên kết đặt mật khẩu mới sẽ được gửi tới email của nhân viên.'
      : 'Mật khẩu cũ sẽ bị thay bằng mật khẩu tạm mới.', 'Đặt lại');
    if (!dongY) return;
    try {
      await DL.datLaiMatKhau(u.id);
      thongBao('Đã gửi email đặt lại mật khẩu tới ' + u.tenDangNhap + '.');
    } catch (loi) {
      console.error('Gửi email đặt lại mật khẩu thất bại:', loi);
      thongBao('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.', 'loi');
    }
  };

  document.getElementById('nvKhoa').onclick = async function () {
    const khoa = u.trangThai !== 'khoa';
    const dongY = await hoi(
      khoa ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
      khoa ? 'Nhân viên sẽ không đăng nhập được cho tới khi được mở khóa.' : 'Nhân viên có thể đăng nhập trở lại.',
      khoa ? 'Khóa' : 'Mở khóa'
    );
    if (!dongY) return;
    DL.khoaTaiKhoan(u.id, khoa);
    thongBao(khoa ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    lamMoi();
  };
}

async function xoaNhanVien(id, xong) {
  const nv = DL.tim('nhanvien', id);
  if (!nv) return;
  if (DL.lay('coso').some(function (c) { return c.quanLyId === id; })) {
    await hoi('Không thể xóa nhân viên', 'Hãy phân công lại cơ sở trước khi xóa quản lý này.', 'Đã hiểu');
    return;
  }
  if (!(await hoi('Xóa nhân viên?', 'Hồ sơ của <b>' + thoat(nv.hoTen) + '</b> và tài khoản đăng nhập (nếu có) sẽ bị xóa.', 'Xóa nhân viên'))) return;
  const u = taiKhoanCuaNhanVien(nv);
  if (u) DL.xoa('nguoidung', u.id);
  DL.xoa('nhanvien', id);
  thongBao('Đã xóa nhân viên.');
  if (xong) xong();
}

/* ============================================================
   CƠ SỞ
   ============================================================ */

function manCoSo() {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Cơ sở', 'Chia phòng trọ theo cơ sở; mỗi cơ sở có một quản lý phụ trách.',
        '<button class="nut nut--chinh" id="themCoSo">Thêm cơ sở</button>') +
      '<div id="khuCoSo"></div>' +
    '</div>';
  veCoSo();
  document.getElementById('themCoSo').onclick = function () {
    moFormCoSo(null, veCoSo);
  };
}

function veCoSo() {
  const khu = document.getElementById('khuCoSo');
  if (!khu) return;
  const coSo = DL.lay('coso');
  const dong = coSo.map(function (c) {
    const quanLy = c.quanLyId ? DL.tim('nhanvien', c.quanLyId) : null;
    const taiKhoan = quanLy ? taiKhoanCuaNhanVien(quanLy) : null;
    const soPhong = DL.lay('phong').filter(function (p) { return p.coSoId === c.id; }).length;
    return [
      '<strong>' + thoat(c.ma) + '</strong>',
      '<div>' + thoat(c.ten) + '</div><div class="phu">' + thoat(c.diaChi || 'Chưa cập nhật địa chỉ') + '</div>',
      soPhong + ' phòng',
      quanLy
        ? '<div>' + thoat(quanLy.hoTen) + '</div><div class="phu">' + thoat(taiKhoan ? taiKhoan.tenDangNhap : 'Chưa cấp tài khoản') + '</div>'
        : '<span class="phu">Chưa phân công</span>',
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-sua-coso="' + c.id + '">Sửa</button>' +
        '<button class="nut nut--xoa" data-xoa-coso="' + c.id + '">Xóa</button>' +
      '</div>'
    ];
  });
  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Tổng cơ sở', so: coSo.length },
      { nhan: 'Đã phân công quản lý', so: coSo.filter(function (c) { return !!c.quanLyId; }).length, lop: 'thong-ke__so--la' },
      { nhan: 'Chưa phân công', so: coSo.filter(function (c) { return !c.quanLyId; }).length, lop: 'thong-ke__so--do' }
    ]) +
    bangHtml(['Mã', 'Cơ sở', 'Quy mô', 'Quản lý', ''], dong, 5);

  khu.onclick = function (e) {
    const sua = e.target.closest('[data-sua-coso]');
    const xoa = e.target.closest('[data-xoa-coso]');
    if (sua) moFormCoSo(DL.tim('coso', sua.dataset.suaCoso), veCoSo);
    if (xoa) xoaCoSo(xoa.dataset.xoaCoso, veCoSo);
  };
}

function moFormCoSo(c, xong) {
  const laSua = !!c;
  const quanLyOptions = DL.lay('nhanvien').filter(function (nv) {
    const taiKhoan = taiKhoanCuaNhanVien(nv);
    if (nv.chucVu !== 'Quản lý cơ sở' || !taiKhoan || taiKhoan.vaiTro !== 'quanly') return false;
    return !DL.lay('coso').some(function (coSo) {
      return coSo.quanLyId === nv.id && (!laSua || coSo.id !== c.id);
    });
  });
  const luaChonQuanLy =
    '<option value="">— Chưa phân công —</option>' +
    quanLyOptions.map(function (nv) {
      return '<option value="' + thoat(nv.id) + '"' +
        (laSua && c.quanLyId === nv.id ? ' selected' : '') + '>' +
        thoat(nv.hoTen) + ' · ' + thoat(nv.email) + '</option>';
    }).join('');

  moHop({
    tieuDe: laSua ? 'Sửa cơ sở' : 'Thêm cơ sở',
    moTa: 'Mỗi cơ sở phải có một quản lý; một quản lý chỉ phụ trách một cơ sở.',
    noiDung:
      '<form class="bieu-mau" id="formCoSo">' +
        '<div class="luoi-nhap">' +
          '<div class="nhom"><label for="csTen">Tên cơ sở *</label><input id="csTen" class="o-nhap" value="' + thoat(laSua ? c.ten : '') + '" placeholder="VD: Cơ sở Nguyễn Trãi"></div>' +
          '<div class="nhom"><label for="csDiaChi">Địa chỉ</label><input id="csDiaChi" class="o-nhap" value="' + thoat(laSua ? c.diaChi : '') + '"></div>' +
          '<div class="nhom rong"><label for="csQuanLy">Quản lý phụ trách *</label><select id="csQuanLy" class="o-chon">' + luaChonQuanLy + '</select>' +
            '<p class="ghi-chu-nho">Chỉ nhân viên đã có tài khoản quản lý mới được chọn. Một quản lý chỉ phụ trách một cơ sở.</p></div>' +
        '</div>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuCoSo">' + (laSua ? 'Lưu thay đổi' : 'Thêm cơ sở') + '</button>'
  });

  document.getElementById('luuCoSo').onclick = function () {
    const ten = giaTri('csTen');
    const quanLyId = giaTri('csQuanLy') || null;
    if (!ten || !quanLyId) { thongBao('Vui lòng nhập tên cơ sở và chọn quản lý phụ trách.', 'loi'); return; }
    if (quanLyId && DL.lay('coso').some(function (x) {
      return x.quanLyId === quanLyId && (!laSua || x.id !== c.id);
    })) {
      thongBao('Quản lý này đã được phân công cho một cơ sở khác.', 'loi');
      return;
    }

    const du = { ten: ten, diaChi: giaTri('csDiaChi'), quanLyId: quanLyId };
    if (laSua) {
      DL.sua('coso', c.id, du);
    } else {
      du.ma = 'CS-' + String(DL.lay('coso').length + 1).padStart(3, '0');
      DL.them('coso', du);
    }
    dongHop();
    thongBao(laSua ? 'Đã cập nhật cơ sở.' : 'Đã thêm cơ sở.');
    if (xong) xong();
  };
}

async function xoaCoSo(id, xong) {
  const c = DL.tim('coso', id);
  if (!c) return;
  if (DL.lay('phong').some(function (p) { return p.coSoId === id; })) {
    await hoi('Không thể xóa cơ sở', 'Hãy chuyển các phòng sang cơ sở khác trước khi xóa.', 'Đã hiểu');
    return;
  }
  const moTa = 'Cơ sở <b>' + thoat(c.ten) + '</b> sẽ bị xóa.' +
    (c.quanLyId ? ' Quản lý của cơ sở này sẽ không thể đăng nhập cho tới khi được phân công lại.' : '');
  if (!(await hoi('Xóa cơ sở?', moTa, 'Xóa cơ sở'))) return;
  DL.xoa('coso', id);
  thongBao('Đã xóa cơ sở.');
  if (xong) xong();
}

/* ============================================================
   GIÁ DỊCH VỤ
   ============================================================ */

let timDichVu = '';

function manDichVu() {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Giá dịch vụ', 'Đơn giá dùng để tính các hóa đơn mới.',
        '<button class="nut nut--chinh" id="themDichVu">Thêm dịch vụ</button>') +
      '<div class="toolbar"><div class="toolbar__trai">' + oTim('timDichVu', 'Tìm tên dịch vụ…', timDichVu) + '</div></div>' +
      '<div id="khuDichVu"></div>' +
    '</div>';
  veDichVu();
  document.getElementById('themDichVu').onclick = function () { moFormDichVu(null, veDichVu); };
  ganTim('timDichVu', function (v) { timDichVu = v; veDichVu(); });
}

function veDichVu() {
  const khu = document.getElementById('khuDichVu');
  if (!khu) return;
  const tim = timDichVu.toLowerCase();
  const ds = DL.lay('dichvu').filter(function (dv) {
    return !tim || (dv.ten + ' ' + dv.donVi).toLowerCase().indexOf(tim) >= 0;
  });

  const dong = ds.map(function (dv) {
    return [
      '<strong>' + thoat(dv.ten) + '</strong>',
      thoat(dv.donVi),
      '<span class="so">' + tien(dv.donGia) + '</span>',
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-sua="' + dv.id + '">Sửa</button>' +
        '<button class="nut nut--xoa" data-xoa="' + dv.id + '">Xóa</button>' +
      '</div>'
    ];
  });

  khu.innerHTML = bangHtml(['Dịch vụ', 'Đơn vị tính', 'Đơn giá', ''], dong) +
    '<p class="ghi-chu-nho">Đơn giá điện, nước và phí dịch vụ được lấy theo hợp đồng khi lập hóa đơn mới. Bảng này dùng để tham chiếu và điền mặc định.</p>';

  khu.onclick = function (e) {
    const sua = e.target.closest('[data-sua]');
    const xoa = e.target.closest('[data-xoa]');
    if (sua) moFormDichVu(DL.tim('dichvu', sua.dataset.sua), veDichVu);
    if (xoa) {
      const dv = DL.tim('dichvu', xoa.dataset.xoa);
      hoi('Xóa dịch vụ?', 'Dịch vụ <b>' + thoat(dv.ten) + '</b> sẽ bị xóa khỏi bảng giá.', 'Xóa').then(function (dongY) {
        if (!dongY) return;
        DL.xoa('dichvu', dv.id);
        thongBao('Đã xóa dịch vụ.');
        veDichVu();
      });
    }
  };
}

function moFormDichVu(dv, xong) {
  const laSua = !!dv;
  moHop({
    tieuDe: laSua ? 'Sửa dịch vụ' : 'Thêm dịch vụ',
    noiDung:
      '<form class="bieu-mau" id="formDichVu">' +
        '<div class="nhom"><label for="dvTen">Tên dịch vụ *</label><input id="dvTen" class="o-nhap" value="' + thoat(laSua ? dv.ten : '') + '" placeholder="VD: Điện"></div>' +
        '<div class="luoi-nhap">' +
          '<div class="nhom"><label for="dvDonVi">Đơn vị tính</label><input id="dvDonVi" class="o-nhap" value="' + thoat(laSua ? dv.donVi : '') + '" placeholder="VD: kWh"></div>' +
          '<div class="nhom"><label for="dvDonGia">Đơn giá</label><input id="dvDonGia" type="number" min="0" step="100" class="o-nhap" value="' + (laSua ? dv.donGia : 0) + '"></div>' +
        '</div>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuDichVu">' + (laSua ? 'Lưu thay đổi' : 'Thêm dịch vụ') + '</button>'
  });
  document.getElementById('luuDichVu').onclick = function () {
    const ten = giaTri('dvTen');
    if (!ten) { thongBao('Vui lòng nhập tên dịch vụ.', 'loi'); return; }
    if (soGiaTri('dvDonGia') < 0) { thongBao('Đơn giá không được âm.', 'loi'); return; }
    const du = { ten: ten, donVi: giaTri('dvDonVi'), donGia: soGiaTri('dvDonGia') };
    if (laSua) DL.sua('dichvu', dv.id, du); else DL.them('dichvu', du);
    dongHop();
    thongBao(laSua ? 'Đã cập nhật dịch vụ.' : 'Đã thêm dịch vụ.');
    if (xong) xong();
  };
}

/* ============================================================
   BÁO CÁO DOANH THU
   ============================================================ */

function manBaoCao() {
  if (!TT.baocao.ky) TT.baocao.ky = thangNay();
  const ky = TT.baocao.ky;
  const ds = DL.lay('hoadon').filter(function (h) { return h.ky === ky && h.trangThai !== 'huy'; });
  const tongLap = ds.reduce(function (t, h) { return t + (Number(h.tong) || 0); }, 0);
  const daThu = ds.reduce(function (t, h) { return t + DL.daThu(h.id); }, 0);
  const chiPhi = DL.lay('chiphi').filter(function (c) { return thangCua(c.ngay) === ky; })
    .reduce(function (t, c) { return t + (Number(c.soTien) || 0); }, 0);
  const thuRong = daThu - chiPhi;

  const dong = ds.slice().sort(function (a, b) { return a.ma.localeCompare(b.ma); }).map(function (h) {
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    const tt = DL.trangThaiHoaDon(h);
    return [
      '<strong>' + thoat(h.ma) + '</strong>',
      p ? thoat(p.ma) : '—',
      k ? thoat(k.hoTen) : '—',
      '<span class="so">' + tien(h.tong) + '</span>',
      '<span class="so">' + tien(tt.daThu) + '</span>',
      '<span class="so">' + tien(tt.con) + '</span>',
      nhanHoaDon(h),
      '<button class="nut nut--ngoc nut--nho" data-xem="' + h.id + '">Xem nhanh</button>'
    ];
  });

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Báo cáo doanh thu', 'Doanh thu đã lập, đã thu, chi phí và thu ròng theo tháng.',
        '<label class="hang" style="gap:8px"><span class="dem">Kỳ</span>' +
        '<input id="kyBaoCao" type="month" class="o-loc" value="' + ky + '"></label>') +
      luoiThongKe([
        { nhan: 'Doanh thu đã lập', so: tien(tongLap), ghiChu: ds.length + ' hóa đơn (không tính hủy)' },
        { nhan: 'Đã thu', so: tien(daThu), lop: 'thong-ke__so--la' },
        { nhan: 'Chi phí', so: tien(chiPhi), lop: 'thong-ke__so--do' },
        { nhan: 'Thu ròng', so: tien(thuRong), lop: thuRong >= 0 ? 'thong-ke__so--xanh' : 'thong-ke__so--do', ghiChu: 'Đã thu − chi phí' }
      ]) +
      (ds.length
        ? bangHtml(['Mã', 'Phòng', 'Khách', 'Tổng', 'Đã thu', 'Còn nợ', 'Trạng thái', ''], dong)
        : trangTrong('Chưa có hóa đơn trong kỳ', 'Chọn tháng khác hoặc tạo hóa đơn cho kỳ này.')) +
    '</div>';

  document.getElementById('kyBaoCao').onchange = function (e) {
    TT.baocao.ky = e.target.value;
    manBaoCao();
  };
  khu.onclick = function (e) {
    const b = e.target.closest('[data-xem]');
    if (b) moChiTietHoaDon(DL.tim('hoadon', b.dataset.xem), QUYEN_ADMIN, function () { manBaoCao(); });
  };
}

/* ============================================================
   CÔNG NỢ
   ============================================================ */

function manCongNo() {
  const tatCa = DL.lay('hoadon').filter(function (h) {
    return h.trangThai !== 'huy' && DL.conNo(h) > 0;
  });
  const tim = TT.congno.tim.toLowerCase();
  const ds = tatCa.filter(function (h) {
    if (!tim) return true;
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    return [h.ma, h.ky, p ? p.ma : '', k ? k.hoTen : ''].join(' ').toLowerCase().indexOf(tim) >= 0;
  }).sort(function (a, b) { return a.han < b.han ? -1 : 1; });

  const tongNo = tatCa.reduce(function (t, h) { return t + DL.conNo(h); }, 0);
  const daThuMotPhan = tatCa.filter(function (h) {
    const da = DL.daThu(h.id);
    return da > 0 && da < h.tong;
  }).reduce(function (t, h) { return t + DL.daThu(h.id); }, 0);
  const soQuaHan = tatCa.filter(function (h) { return DL.trangThaiHoaDon(h).quaHan; }).length;

  const dong = ds.map(function (h) {
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    const tt = DL.trangThaiHoaDon(h);
    return [
      kyDep(h.ky),
      p ? thoat(p.ma) : '—',
      k ? thoat(k.hoTen) : '—',
      '<span class="so">' + tien(h.tong) + '</span>',
      '<span class="so">' + tien(tt.daThu) + '</span>',
      '<span class="so"><b>' + tien(tt.con) + '</b></span>',
      ngay(h.han),
      h.han < homNay() ? nhan('Quá hạn', 'do') : nhan('Trong hạn', ''),
      '<button class="nut nut--chinh nut--nho" data-thu="' + h.id + '">Thu tiền</button>'
    ];
  });

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Công nợ', 'Các hóa đơn còn nợ và ghi nhận thanh toán nhanh.') +
      luoiThongKe([
        { nhan: 'Tổng công nợ', so: tien(tongNo), lop: 'thong-ke__so--do', ghiChu: tatCa.length + ' hóa đơn còn nợ' },
        { nhan: 'Đã thu một phần', so: tien(daThuMotPhan), lop: 'thong-ke__so--xanh' },
        { nhan: 'Hóa đơn quá hạn', so: soQuaHan, lop: 'thong-ke__so--do' }
      ]) +
      '<div class="toolbar"><div class="toolbar__trai">' +
        oTim('timCongNo', 'Tìm mã, kỳ, phòng, khách…', TT.congno.tim) +
      '</div><span class="dem" id="demCongNo"></span></div>' +
      '<div id="khuCongNo">' +
        (ds.length
          ? bangHtml(['Kỳ', 'Phòng', 'Khách', 'Tổng', 'Đã thu', 'Còn lại', 'Hạn', 'Tình trạng', ''], dong)
          : trangTrong('Không còn công nợ', 'Tất cả hóa đơn đã được thanh toán đủ.')) +
      '</div>' +
    '</div>';

  const oDem = document.getElementById('demCongNo');
  if (oDem) oDem.textContent = ds.length + ' hóa đơn';

  ganTim('timCongNo', function (v) { TT.congno.tim = v; manCongNo(); });
  document.getElementById('khuCongNo').onclick = function (e) {
    const b = e.target.closest('[data-thu]');
    if (b) moThanhToan(DL.tim('hoadon', b.dataset.thu), function () { manCongNo(); });
  };
}

/* ============================================================
   CHI PHÍ
   ============================================================ */

function manChiPhi() {
  if (!TT.chiphi.ky) TT.chiphi.ky = thangNay();
  const ky = TT.chiphi.ky;
  const tim = TT.chiphi.tim.toLowerCase();

  const ds = DL.lay('chiphi').filter(function (c) {
    if (thangCua(c.ngay) !== ky) return false;
    if (!tim) return true;
    return (c.ten + ' ' + c.danhMuc + ' ' + c.khuVuc).toLowerCase().indexOf(tim) >= 0;
  }).sort(function (a, b) { return a.ngay < b.ngay ? 1 : -1; });

  const tong = ds.reduce(function (t, c) { return t + (Number(c.soTien) || 0); }, 0);

  const dong = ds.map(function (c) {
    return [
      ngay(c.ngay),
      '<strong>' + thoat(c.ten) + '</strong>',
      thoat(c.danhMuc),
      thoat(c.khuVuc),
      '<span class="so">' + tien(c.soTien) + '</span>',
      thoat(c.ghiChu) || '<span class="phu">—</span>',
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-sua="' + c.id + '">Sửa</button>' +
        '<button class="nut nut--xoa" data-xoa="' + c.id + '">Xóa</button>' +
      '</div>'
    ];
  });

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Chi phí', 'Ghi nhận các khoản chi sửa chữa, bảo trì, vận hành và khác.',
        '<button class="nut nut--chinh" id="themChiPhi">Thêm khoản chi</button>') +
      '<div class="toolbar"><div class="toolbar__trai">' +
        '<input id="kyChiPhi" type="month" class="o-loc" value="' + ky + '">' +
        oTim('timChiPhi', 'Tìm tên khoản, danh mục, khu vực…', TT.chiphi.tim) +
      '</div><span class="dem" id="demChiPhi"></span></div>' +
      '<div id="khuChiPhi"></div>' +
    '</div>';

  const khuDs = document.getElementById('khuChiPhi');
  khuDs.innerHTML =
    luoiThongKe([
      { nhan: 'Số khoản chi', so: ds.length, ghiChu: 'Tháng ' + kyDep(ky) },
      { nhan: 'Tổng chi', so: tien(tong), lop: 'thong-ke__so--do' }
    ]) +
    bangHtml(['Ngày', 'Khoản chi', 'Danh mục', 'Khu vực / phòng', 'Số tiền', 'Ghi chú', ''], dong);

  const oDem = document.getElementById('demChiPhi');
  if (oDem) oDem.textContent = ds.length + ' khoản';

  document.getElementById('themChiPhi').onclick = function () { moFormChiPhi(null, manChiPhi); };
  document.getElementById('kyChiPhi').onchange = function (e) { TT.chiphi.ky = e.target.value; manChiPhi(); };
  ganTim('timChiPhi', function (v) { TT.chiphi.tim = v; manChiPhi(); });

  khuDs.onclick = function (e) {
    const sua = e.target.closest('[data-sua]');
    const xoa = e.target.closest('[data-xoa]');
    if (sua) moFormChiPhi(DL.tim('chiphi', sua.dataset.sua), manChiPhi);
    if (xoa) {
      const c = DL.tim('chiphi', xoa.dataset.xoa);
      hoi('Xóa khoản chi?', 'Khoản <b>' + thoat(c.ten) + '</b> (' + tien(c.soTien) + ') sẽ bị xóa.', 'Xóa khoản chi').then(function (dongY) {
        if (!dongY) return;
        DL.xoa('chiphi', c.id);
        thongBao('Đã xóa khoản chi.');
        manChiPhi();
      });
    }
  };
}

function moFormChiPhi(c, xong) {
  const laSua = !!c;
  moHop({
    tieuDe: laSua ? 'Sửa khoản chi' : 'Thêm khoản chi',
    noiDung:
      '<form class="bieu-mau" id="formChiPhi">' +
        '<div class="luoi-nhap">' +
          '<div class="nhom rong"><label for="cpTen">Tên khoản chi *</label><input id="cpTen" class="o-nhap" value="' + thoat(laSua ? c.ten : '') + '" placeholder="VD: Sửa vòi nước phòng 101"></div>' +
          '<div class="nhom"><label for="cpNgay">Ngày chi</label><input id="cpNgay" type="date" class="o-nhap" value="' + thoat(laSua ? c.ngay : homNay()) + '"></div>' +
          '<div class="nhom"><label for="cpDanhMuc">Danh mục</label><select id="cpDanhMuc" class="o-chon">' +
            ['Sửa chữa', 'Bảo trì', 'Vận hành', 'Khác'].map(function (d) {
              return '<option' + (laSua && c.danhMuc === d ? ' selected' : '') + '>' + d + '</option>';
            }).join('') +
          '</select></div>' +
          '<div class="nhom"><label for="cpKhuVuc">Khu vực / phòng</label><input id="cpKhuVuc" class="o-nhap" value="' + thoat(laSua ? c.khuVuc : '') + '" placeholder="VD: Khu A hoặc P101"></div>' +
          '<div class="nhom"><label for="cpSoTien">Số tiền *</label><input id="cpSoTien" type="number" min="0" step="1000" class="o-nhap" value="' + (laSua ? c.soTien : 0) + '"></div>' +
          '<div class="nhom rong"><label for="cpGhiChu">Ghi chú</label><input id="cpGhiChu" class="o-nhap" value="' + thoat(laSua ? c.ghiChu : '') + '"></div>' +
        '</div>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuChiPhi">' + (laSua ? 'Lưu thay đổi' : 'Thêm khoản chi') + '</button>'
  });
  document.getElementById('luuChiPhi').onclick = function () {
    const ten = giaTri('cpTen');
    const soTien = soGiaTri('cpSoTien');
    if (!ten) { thongBao('Vui lòng nhập tên khoản chi.', 'loi'); return; }
    if (soTien < 0) { thongBao('Số tiền không được âm.', 'loi'); return; }
    const du = {
      ten: ten, ngay: giaTri('cpNgay'), danhMuc: giaTri('cpDanhMuc'),
      khuVuc: giaTri('cpKhuVuc'), soTien: soTien, ghiChu: giaTri('cpGhiChu')
    };
    if (laSua) DL.sua('chiphi', c.id, du); else DL.them('chiphi', du);
    dongHop();
    thongBao(laSua ? 'Đã cập nhật khoản chi.' : 'Đã thêm khoản chi.');
    if (xong) xong();
  };
}

/* ============================================================
   KHỞI ĐỘNG TRANG
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  DL.sanSang.then(function () {
    const nd = khoiTaoKhung({ vaiTro: 'admin', menu: MENU_ADMIN, tenVaiTro: 'Chủ trọ' });
    if (!nd) return;

    window.cacManHinh = {
      tongquan: manTongQuan,
      phong: function () { manPhong(QUYEN_ADMIN); },
      khach: function () { manKhach(QUYEN_ADMIN); },
      hopdong: function () { manHopDong(QUYEN_ADMIN); },
      suco: function () { manSuCo(QUYEN_ADMIN); },
      hoadon: function () { manHoaDon(QUYEN_ADMIN); },
      congno: manCongNo,
      baocao: manBaoCao,
      chiphi: manChiPhi,
      dichvu: manDichVu,
      coso: manCoSo,
      nhansu: manNhanVien,
      thongbao: function () { manThongBao(QUYEN_ADMIN); },
      taikhoan: function () { manTaiKhoan(QUYEN_ADMIN); }
    };

    window.addEventListener('hashchange', function () {
      const ten = location.hash.slice(1);
      if (window.cacManHinh[ten]) chuyenManHinh(ten);
    });

    const dau = (location.hash || '#tongquan').slice(1);
    chuyenManHinh(window.cacManHinh[dau] ? dau : 'tongquan');
  }).catch(function (loi) {
    console.error('Khởi tạo dashboard Supabase thất bại:', loi);
    const khu = document.getElementById('noidung');
    if (khu) khu.innerHTML = '<div class="man"><p class="loi">Không thể tải dữ liệu từ Supabase. Tải lại trang để thử lại.</p></div>';
  });
});

/* ============================================================
   nghiepvu.js — Các màn hình dùng chung cho chủ trọ và quản lý.
   Mỗi màn hình nhận tham số `quyen` để biết được xóa/hủy hay không.
   ============================================================ */

/* Trạng thái bộ lọc của từng màn hình */
const TT = {
  phong: { tim: '', loc: 'tatca' },
  khach: { tim: '', loc: 'tatca' },
  hopdong: { tim: '', loc: 'tatca' },
  hoadon: { tim: '', loc: 'tatca', ky: '' },
  suco: { tim: '', loc: 'tatca', mucDo: 'tatca' },
  congno: { tim: '' },
  chiphi: { tim: '', ky: '' },
  baocao: { ky: '' }
};

function taiKhoanCuaKhach(k) {
  return DL.nguoiDungCuaHoSo(k.id, 'khach');
}

function taiKhoanCuaNhanVien(nv) {
  return DL.nguoiDungCuaHoSo(nv.id, 'nhanvien');
}

/* Cấp tài khoản khách thuê rồi hiện mật khẩu tạm */
async function capTaiKhoanKhach(k, xong) {
  try {
    const kq = await DL.capTaiKhoan({
      hoTen: k.hoTen, email: k.email, sdt: k.sdt,
      hoSoId: k.id, loaiHoSo: 'khach', vaiTro: 'khachthue'
    });
    if (!kq.ok) { thongBao(kq.loi, 'loi'); return; }
    if (kq.invited) {
      thongBao('Đã gửi email mời đăng nhập tới ' + k.email + '.');
      if (xong) xong();
      return;
    }
    hienMatKhauTam(kq.nguoidung.tenDangNhap, kq.matKhau, k.hoTen, xong);
  } catch (loi) {
    console.error('Cấp tài khoản khách thất bại:', loi);
    thongBao('Không thể gửi lời mời Supabase. Vui lòng thử lại.', 'loi');
  }
}

/* Cấp tài khoản nhân viên quản lý */
async function capTaiKhoanNhanVien(nv, xong) {
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
    hienMatKhauTam(kq.nguoidung.tenDangNhap, kq.matKhau, nv.hoTen, xong);
  } catch (loi) {
    console.error('Cấp tài khoản quản lý thất bại:', loi);
    thongBao('Không thể gửi lời mời Supabase. Vui lòng thử lại.', 'loi');
  }
}

/* ============================================================
   MÀN HÌNH PHÒNG
   ============================================================ */

function manPhong(quyen) {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Phòng', 'Danh sách phòng, giá thuê và trạng thái. Trạng thái “Đang thuê” đi theo hợp đồng hiệu lực.',
        '<button class="nut nut--chinh" id="themPhong">Thêm phòng</button>') +
      '<div class="toolbar">' +
        '<div class="toolbar__trai">' +
          oTim('timPhong', 'Tìm mã, tên, tầng, khu vực…', TT.phong.tim) +
          '<div class="nhom-chip" id="chipPhong">' +
            chipLoc('tatca', 'Tất cả', TT.phong.loc === 'tatca') +
            chipLoc('trong', 'Còn trống', TT.phong.loc === 'trong') +
            chipLoc('dangthue', 'Đang thuê', TT.phong.loc === 'dangthue') +
            chipLoc('baotri', 'Bảo trì', TT.phong.loc === 'baotri') +
          '</div>' +
        '</div>' +
        '<span class="dem" id="demPhong"></span>' +
      '</div>' +
      '<div id="khuPhong"></div>' +
    '</div>';

  vePhong(quyen);

  document.getElementById('themPhong').onclick = function () {
    moFormPhong(null, function () { vePhong(quyen); });
  };
  ganTim('timPhong', function (v) { TT.phong.tim = v; vePhong(quyen); });
  ganChip('chipPhong', function (loc) {
    TT.phong.loc = loc;
    document.querySelectorAll('#chipPhong .chip').forEach(function (b) {
      b.classList.toggle('dang-chon', b.dataset.loc === loc);
    });
    vePhong(quyen);
  });
}

function vePhong(quyen) {
  const khu = document.getElementById('khuPhong');
  if (!khu) return;
  const tatCa = DL.lay('phong');
  const tim = TT.phong.tim.toLowerCase();
  const ds = tatCa.filter(function (p) {
    if (TT.phong.loc !== 'tatca' && p.trangThai !== TT.phong.loc) return false;
    if (!tim) return true;
    return (p.ma + ' ' + p.ten + ' ' + p.tang + ' ' + (p.khuVuc || '')).toLowerCase().indexOf(tim) >= 0;
  }).sort(function (a, b) { return a.ma.localeCompare(b.ma); });

  const dem = { trong: 0, dangthue: 0, baotri: 0 };
  tatCa.forEach(function (p) { dem[p.trangThai] = (dem[p.trangThai] || 0) + 1; });

  const dong = ds.map(function (p) {
    const hd = DL.hopDongHieuLuc(p.id);
    const k = hd ? DL.tim('khach', hd.khachId) : null;
    return [
      '<strong>' + thoat(p.ma) + '</strong>',
      '<div>' + thoat(p.ten) + '</div><div class="phu">' + thoat(p.khuVuc || 'Chưa xếp khu') + '</div>',
      (DL.tim('coso', p.coSoId) || {}).ten || '—',
      'Tầng ' + thoat(p.tang),
      thoat(p.dienTich) + ' m²',
      '<span class="so">' + tien(p.gia) + '</span>',
      k ? thoat(k.hoTen) : '<span class="phu">—</span>',
      nhanPhong(p),
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-sua="' + p.id + '">Sửa</button>' +
        (quyen.xoaPhong ? '<button class="nut nut--xoa" data-xoa="' + p.id + '">Xóa</button>' : '') +
      '</div>'
    ];
  });

  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Tổng phòng', so: tatCa.length },
      { nhan: 'Đang thuê', so: dem.dangthue, lop: 'thong-ke__so--xanh' },
      { nhan: 'Còn trống', so: dem.trong, lop: 'thong-ke__so--la' },
      { nhan: 'Bảo trì', so: dem.baotri, lop: 'thong-ke__so--do' }
    ]) +
    bangHtml(['Mã', 'Phòng', 'Cơ sở', 'Tầng', 'Diện tích', 'Giá thuê', 'Khách hiện tại', 'Trạng thái', ''], dong);

  const oDem = document.getElementById('demPhong');
  if (oDem) oDem.textContent = ds.length + ' / ' + tatCa.length + ' phòng';

  khu.onclick = function (e) {
    const sua = e.target.closest('[data-sua]');
    const xoa = e.target.closest('[data-xoa]');
    if (sua) {
      const p = DL.tim('phong', sua.dataset.sua);
      moFormPhong(p, function () { vePhong(quyen); });
    }
    if (xoa) xoaPhong(xoa.dataset.xoa, function () { vePhong(quyen); });
  };
}

/* Mở biểu mẫu thêm/sửa phòng */
function moFormPhong(p, xong) {
  const laSua = !!p;
  const coSoOptions = DL.lay('coso').map(function (c) {
    return '<option value="' + thoat(c.id) + '"' +
      ((laSua && p.coSoId === c.id) || (!laSua && c.id === (DL.coSoCuaPhien() || {}).id) ? ' selected' : '') +
      '>' + thoat(c.ten) + '</option>';
  }).join('');
  const lop = moHop({
    tieuDe: laSua ? 'Sửa phòng' : 'Thêm phòng',
    moTa: 'Mã phòng không được trùng. Trạng thái phòng được đồng bộ theo hợp đồng hiệu lực.',
    noiDung:
      '<form class="bieu-mau" id="formPhong">' +
        '<div class="luoi-nhap">' +
          '<div class="nhom"><label for="fpMa">Mã phòng *</label><input id="fpMa" class="o-nhap" value="' + thoat(laSua ? p.ma : '') + '" placeholder="VD: P104"></div>' +
          '<div class="nhom"><label for="fpTen">Tên phòng *</label><input id="fpTen" class="o-nhap" value="' + thoat(laSua ? p.ten : '') + '" placeholder="VD: Phòng 104"></div>' +
          '<div class="nhom"><label for="fpCoSo">Cơ sở *</label><select id="fpCoSo" class="o-chon">' + coSoOptions + '</select></div>' +
          '<div class="nhom"><label for="fpTang">Tầng</label><input id="fpTang" type="number" min="0" class="o-nhap" value="' + (laSua ? p.tang : 1) + '"></div>' +
          '<div class="nhom"><label for="fpKhuVuc">Khu vực</label><input id="fpKhuVuc" class="o-nhap" value="' + thoat(laSua ? p.khuVuc : 'Khu A') + '" placeholder="VD: Khu A"></div>' +
          '<div class="nhom"><label for="fpDienTich">Diện tích (m²)</label><input id="fpDienTich" type="number" min="0" class="o-nhap" value="' + (laSua ? p.dienTich : 25) + '"></div>' +
          '<div class="nhom"><label for="fpGia">Giá thuê / tháng</label><input id="fpGia" type="number" min="0" step="1000" class="o-nhap" value="' + (laSua ? p.gia : 3500000) + '"></div>' +
          '<div class="nhom"><label for="fpTrangThai">Trạng thái</label><select id="fpTrangThai" class="o-chon">' +
            '<option value="trong"' + (laSua && p.trangThai === 'trong' ? ' selected' : '') + '>Còn trống</option>' +
            '<option value="dangthue"' + (laSua && p.trangThai === 'dangthue' ? ' selected' : '') + '>Đang thuê</option>' +
            '<option value="baotri"' + (laSua && p.trangThai === 'baotri' ? ' selected' : '') + '>Bảo trì</option>' +
          '</select></div>' +
          '<div class="nhom"><label for="fpGhiChu">Ghi chú</label><input id="fpGhiChu" class="o-nhap" value="' + thoat(laSua ? p.ghiChu : '') + '"></div>' +
        '</div>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuPhong">' + (laSua ? 'Lưu thay đổi' : 'Thêm phòng') + '</button>'
  });

  document.getElementById('luuPhong').onclick = function () {
    const ma = giaTri('fpMa').toUpperCase();
    const ten = giaTri('fpTen');
    const coSoId = giaTri('fpCoSo');
    if (!ma || !ten || !coSoId) { thongBao('Vui lòng nhập mã, tên phòng và chọn cơ sở.', 'loi'); return; }
    const trung = DL.giaTriDaTonTai('phong', 'ma', ma, laSua ? p.id : null);
    if (trung) { thongBao('Mã phòng này đã tồn tại.', 'loi'); return; }
    const du = {
      ma: ma, ten: ten, coSoId: coSoId, tang: soGiaTri('fpTang'), khuVuc: giaTri('fpKhuVuc'),
      dienTich: soGiaTri('fpDienTich'), gia: soGiaTri('fpGia'),
      trangThai: giaTri('fpTrangThai') || 'trong', ghiChu: giaTri('fpGhiChu')
    };
    if (du.gia < 0 || du.dienTich < 0) { thongBao('Diện tích và giá thuê không được âm.', 'loi'); return; }
    if (laSua && coSoId !== p.coSoId && (
      DL.giaTriDaTonTai('khach', 'phongId', p.id) ||
      DL.giaTriDaTonTai('hopdong', 'phongId', p.id) ||
      DL.giaTriDaTonTai('hoadon', 'phongId', p.id) ||
      DL.giaTriDaTonTai('chiso', 'phongId', p.id) ||
      DL.giaTriDaTonTai('suco', 'phongId', p.id)
    )) {
      thongBao('Không thể chuyển cơ sở vì phòng đã có hồ sơ khách hoặc dữ liệu vận hành.', 'loi');
      return;
    }
    if (laSua) DL.sua('phong', p.id, du);
    else DL.them('phong', du);
    dongHop();
    thongBao(laSua ? 'Đã cập nhật phòng.' : 'Đã thêm phòng mới.');
    if (xong) xong();
  };
}

/* Xóa phòng, chặn nếu đã có dữ liệu liên quan */
async function xoaPhong(id, xong) {
  const p = DL.tim('phong', id);
  if (!p) return;
  const coDuLieu =
    DL.lay('hopdong').some(function (h) { return h.phongId === id; }) ||
    DL.lay('hoadon').some(function (h) { return h.phongId === id; }) ||
    DL.lay('chiso').some(function (c) { return c.phongId === id; }) ||
    DL.lay('suco').some(function (s) { return s.phongId === id; });
  if (coDuLieu) {
    await hoi('Không thể xóa phòng', 'Phòng <b>' + thoat(p.ma) + '</b> đã có hợp đồng, hóa đơn, chỉ số điện nước hoặc sự cố. Hãy xử lý dữ liệu liên quan trước.', 'Đã hiểu');
    return;
  }
  if (!(await hoi('Xóa phòng?', 'Phòng <b>' + thoat(p.ma) + '</b> sẽ bị xóa khỏi danh sách.', 'Xóa phòng'))) return;
  DL.xoa('phong', id);
  thongBao('Đã xóa phòng.');
  if (xong) xong();
}

/* ============================================================
   MÀN HÌNH KHÁCH THUÊ
   ============================================================ */

function manKhach(quyen) {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Khách thuê', 'Hồ sơ khách, phòng đang ở, trạng thái và tài khoản đăng nhập.',
        '<button class="nut nut--chinh" id="themKhach">Thêm khách</button>') +
      '<div class="toolbar">' +
        '<div class="toolbar__trai">' +
          oTim('timKhach', 'Tìm họ tên, SĐT, CCCD, email, phòng…', TT.khach.tim) +
          '<div class="nhom-chip" id="chipKhach">' +
            chipLoc('tatca', 'Tất cả', TT.khach.loc === 'tatca') +
            chipLoc('dangthue', 'Đang thuê', TT.khach.loc === 'dangthue') +
            chipLoc('chuapho', 'Chưa xếp phòng', TT.khach.loc === 'chuapho') +
            chipLoc('daroi', 'Đã rời đi', TT.khach.loc === 'daroi') +
          '</div>' +
        '</div>' +
        '<span class="dem" id="demKhach"></span>' +
      '</div>' +
      '<div id="khuKhach"></div>' +
    '</div>';

  veKhach(quyen);

  document.getElementById('themKhach').onclick = function () {
    moFormKhach(null, function () { veKhach(quyen); }, quyen);
  };
  ganTim('timKhach', function (v) { TT.khach.tim = v; veKhach(quyen); });
  ganChip('chipKhach', function (loc) {
    TT.khach.loc = loc;
    document.querySelectorAll('#chipKhach .chip').forEach(function (b) {
      b.classList.toggle('dang-chon', b.dataset.loc === loc);
    });
    veKhach(quyen);
  });
}

function veKhach(quyen) {
  const khu = document.getElementById('khuKhach');
  if (!khu) return;
  const tatCa = DL.lay('khach');
  const tim = TT.khach.tim.toLowerCase();

  const ds = tatCa.filter(function (k) {
    const p = k.phongId ? DL.tim('phong', k.phongId) : null;
    if (TT.khach.loc === 'chuapho' && k.phongId) return false;
    if (TT.khach.loc === 'dangthue' && k.trangThai !== 'dangthue') return false;
    if (TT.khach.loc === 'daroi' && k.trangThai !== 'daroi') return false;
    if (!tim) return true;
    const chuoi = [k.hoTen, k.sdt, k.cccd, k.email, p ? p.ma : '', p ? p.ten : ''].join(' ').toLowerCase();
    return chuoi.indexOf(tim) >= 0;
  }).sort(function (a, b) { return a.ma.localeCompare(b.ma); });

  const soDangO = tatCa.filter(function (k) { return k.trangThai === 'dangthue' && k.phongId; }).length;
  const soChuaPhong = tatCa.filter(function (k) { return k.trangThai === 'dangthue' && !k.phongId; }).length;
  const soTaiKhoan = tatCa.filter(function (k) { return taiKhoanCuaKhach(k); }).length;

  const dong = ds.map(function (k) {
    const p = k.phongId ? DL.tim('phong', k.phongId) : null;
    const u = taiKhoanCuaKhach(k);
    return [
      '<strong>' + thoat(k.ma) + '</strong>',
      '<div>' + thoat(k.hoTen) + '</div><div class="phu">' + thoat(k.cccd || 'Chưa có CCCD') + '</div>',
      thoat(k.sdt),
      p ? thoat(p.ma) + '<div class="phu">' + thoat(p.ten) + '</div>' : '<span class="phu">Chưa xếp</span>',
      ngay(k.ngayVao),
      k.trangThai === 'dangthue' ? nhan('Đang thuê', 'xanh') : nhan('Đã rời đi', ''),
      nhanTaiKhoan(u),
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-sua="' + k.id + '">Sửa</button>' +
        '<button class="nut nut--ngoc nut--nho" data-tk="' + k.id + '">Tài khoản</button>' +
        (quyen.xoaKhach ? '<button class="nut nut--xoa" data-xoa="' + k.id + '">Xóa</button>' : '') +
      '</div>'
    ];
  });

  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Tổng khách', so: tatCa.length },
      { nhan: 'Đang ở', so: soDangO, lop: 'thong-ke__so--xanh' },
      { nhan: 'Chưa xếp phòng', so: soChuaPhong, lop: 'thong-ke__so--do' },
      { nhan: 'Đã cấp tài khoản', so: soTaiKhoan, lop: 'thong-ke__so--la' }
    ]) +
    bangHtml(['Mã', 'Khách', 'SĐT', 'Phòng', 'Ngày vào', 'Trạng thái', 'Tài khoản', ''], dong);

  const oDem = document.getElementById('demKhach');
  if (oDem) oDem.textContent = ds.length + ' / ' + tatCa.length + ' khách';

  khu.onclick = function (e) {
    const sua = e.target.closest('[data-sua]');
    const tk = e.target.closest('[data-tk]');
    const xoa = e.target.closest('[data-xoa]');
    if (sua) {
      moFormKhach(DL.tim('khach', sua.dataset.sua), function () { veKhach(quyen); }, quyen);
    }
    if (tk) {
      moTaiKhoanKhach(DL.tim('khach', tk.dataset.tk), function () { veKhach(quyen); });
    }
    if (xoa) xoaKhach(xoa.dataset.xoa, function () { veKhach(quyen); });
  };
}

/* Danh sách phòng cho ô chọn */
function tuyChonPhong(dangChon, coSoId) {
  return '<option value="">— Chưa xếp phòng —</option>' + DL.lay('phong')
    .filter(function (p) { return !coSoId || p.coSoId === coSoId; })
    .slice().sort(function (a, b) { return a.ma.localeCompare(b.ma); })
    .map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === dangChon ? ' selected' : '') + '>' +
        thoat(p.ma) + ' — ' + thoat(p.ten) + (p.trangThai === 'baotri' ? ' (bảo trì)' : '') + '</option>';
    }).join('');
}

/* Mở biểu mẫu thêm/sửa khách */
function moFormKhach(k, xong, quyen) {
  const laSua = !!k;
  const coSoPhien = DL.coSoCuaPhien();
  const coSoMacDinh = laSua ? k.coSoId : (coSoPhien ? coSoPhien.id : ((DL.lay('coso')[0] || {}).id || ''));
  const luaChonCoSo = DL.lay('coso').map(function (c) {
    return '<option value="' + thoat(c.id) + '"' + (c.id === coSoMacDinh ? ' selected' : '') + '>' +
      thoat(c.ten) + '</option>';
  }).join('');
  const lop = moHop({
    rong: true,
    tieuDe: laSua ? 'Sửa hồ sơ khách thuê' : 'Thêm khách thuê',
    moTa: laSua ? 'Tài khoản đăng nhập được quản lý riêng bằng nút “Tài khoản” trong danh sách.' : 'Có thể cấp tài khoản ngay và nhận mật khẩu tạm sau khi lưu.',
    noiDung:
      '<form class="bieu-mau" id="formKhach">' +
        '<div class="nhom-thong-tin"><h3>Thông tin cá nhân</h3><div class="luoi-nhap">' +
          '<div class="nhom"><label for="fkHoTen">Họ tên *</label><input id="fkHoTen" class="o-nhap" value="' + thoat(laSua ? k.hoTen : '') + '"></div>' +
          '<div class="nhom"><label for="fkSdt">Số điện thoại *</label><input id="fkSdt" class="o-nhap" value="' + thoat(laSua ? k.sdt : '') + '" placeholder="VD: 0901234567"></div>' +
          '<div class="nhom"><label for="fkCccd">CCCD / CMND</label><input id="fkCccd" class="o-nhap" value="' + thoat(laSua ? k.cccd : '') + '"></div>' +
          '<div class="nhom"><label for="fkEmail">Email (tên đăng nhập)</label><input id="fkEmail" type="email" class="o-nhap" value="' + thoat(laSua ? k.email : '') + '" placeholder="Bỏ trống nếu dùng SĐT"></div>' +
          '<div class="nhom"><label for="fkQueQuan">Quê quán</label><input id="fkQueQuan" class="o-nhap" value="' + thoat(laSua ? k.queQuan : '') + '"></div>' +
          '<div class="nhom"><label for="fkDiaChi">Địa chỉ thường trú</label><input id="fkDiaChi" class="o-nhap" value="' + thoat(laSua ? k.diaChi : '') + '"></div>' +
        '</div></div>' +
        '<div class="nhom-thong-tin"><h3>Phòng và trạng thái</h3><div class="luoi-nhap">' +
          '<div class="nhom"><label for="fkCoSo">Cơ sở phụ trách *</label><select id="fkCoSo" class="o-chon">' + luaChonCoSo + '</select></div>' +
          '<div class="nhom"><label for="fkPhong">Phòng đang ở</label><select id="fkPhong" class="o-chon">' + tuyChonPhong(laSua ? k.phongId : '', coSoMacDinh) + '</select></div>' +
          '<div class="nhom"><label for="fkNgayVao">Ngày vào ở</label><input id="fkNgayVao" type="date" class="o-nhap" value="' + thoat(laSua ? k.ngayVao : homNay()) + '"></div>' +
          '<div class="nhom"><label for="fkTrangThai">Trạng thái</label><select id="fkTrangThai" class="o-chon">' +
            '<option value="dangthue"' + (!laSua || k.trangThai === 'dangthue' ? ' selected' : '') + '>Đang thuê</option>' +
            '<option value="daroi"' + (laSua && k.trangThai === 'daroi' ? ' selected' : '') + '>Đã rời đi</option>' +
          '</select></div>' +
          '<div class="nhom"><label for="fkGhiChu">Ghi chú</label><input id="fkGhiChu" class="o-nhap" value="' + thoat(laSua ? k.ghiChu : '') + '"></div>' +
        '</div></div>' +
        (laSua ? '' :
          '<div class="nhom-thong-tin"><label class="hop-chon"><input type="checkbox" id="fkCapTk" checked> Cấp tài khoản ngay và hiển thị mật khẩu tạm</label>' +
          '<p class="goi-y" style="margin-top:8px">Tên đăng nhập là email của khách; nếu không có email sẽ dùng SĐT@tenant.local.</p></div>') +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuKhach">' + (laSua ? 'Lưu thay đổi' : 'Thêm khách') + '</button>'
  });

  document.getElementById('fkCoSo').onchange = function () {
    const phong = DL.tim('phong', giaTri('fkPhong'));
    const phongId = phong && phong.coSoId === giaTri('fkCoSo') ? phong.id : '';
    document.getElementById('fkPhong').innerHTML = tuyChonPhong(phongId, giaTri('fkCoSo'));
  };

  document.getElementById('luuKhach').onclick = function () {
    const hoTen = giaTri('fkHoTen');
    const sdt = giaTri('fkSdt');
    if (!hoTen || !sdt) { thongBao('Vui lòng nhập họ tên và số điện thoại.', 'loi'); return; }
    const trungSdt = DL.giaTriDaTonTai('khach', 'sdt', sdt, laSua ? k.id : null);
    if (trungSdt) { thongBao('Số điện thoại này đã có trong hồ sơ khách khác.', 'loi'); return; }

    const phongId = giaTri('fkPhong');
    const coSoId = giaTri('fkCoSo');
    const phong = phongId ? DL.tim('phong', phongId) : null;
    if (!coSoId || !DL.tim('coso', coSoId)) { thongBao('Vui lòng chọn cơ sở phụ trách.', 'loi'); return; }
    if (phongId && (!phong || phong.coSoId !== coSoId)) {
      thongBao('Phòng đã chọn không thuộc cơ sở phụ trách.', 'loi');
      return;
    }
    const ngayVao = giaTri('fkNgayVao');
    const trangThai = giaTri('fkTrangThai');
    const du = {
      hoTen: hoTen, sdt: sdt, cccd: giaTri('fkCccd'), email: giaTri('fkEmail').toLowerCase(),
      queQuan: giaTri('fkQueQuan'), diaChi: giaTri('fkDiaChi'), phongId: phongId, coSoId: coSoId,
      ngayVao: phongId ? ngayVao : '', trangThai: trangThai, ghiChu: giaTri('fkGhiChu')
    };

    let hoSo = null;
    if (laSua) {
      hoSo = DL.sua('khach', k.id, du);
    } else {
      du.ma = 'K-' + String(DL.soBanGhiToanBo('khach') + 1).padStart(3, '0');
      hoSo = DL.them('khach', du);
    }

    const u = hoSo ? taiKhoanCuaKhach(hoSo) : null;
    const muonCapTk = !laSua && document.getElementById('fkCapTk') && document.getElementById('fkCapTk').checked;
    const vuaRoiDi = laSua && trangThai === 'daroi' && k.trangThai !== 'daroi';

    dongHop();
    thongBao(laSua ? 'Đã cập nhật hồ sơ khách.' : 'Đã thêm khách thuê.');

    if (muonCapTk) {
      capTaiKhoanKhach(hoSo, xong);
      return;
    }
    if (vuaRoiDi && u && u.trangThai === 'hoatdong') {
      hoi('Khóa tài khoản khách?', 'Khách đã chuyển sang “Đã rời đi”. Bạn có muốn khóa tài khoản đăng nhập của khách không?', 'Khóa tài khoản').then(function (dongY) {
        if (dongY) { DL.khoaTaiKhoan(u.id, true); thongBao('Đã khóa tài khoản khách.'); }
        if (xong) xong();
      });
      return;
    }
    if (xong) xong();
  };
}

/* Hộp thoại quản lý tài khoản khách */
function moTaiKhoanKhach(k, xong) {
  if (!k) return;
  const u = taiKhoanCuaKhach(k);
  const ten = u ? u.tenDangNhap : DL.tenDangNhapTuHoSo(k);

  const lamMoi = function () {
    if (xong) xong();
    moTaiKhoanKhach(DL.tim('khach', k.id), xong);
  };

  const lop = moHop({
    tieuDe: 'Tài khoản của ' + thoat(k.hoTen),
    moTa: 'Tài khoản dùng để đăng nhập trang khách thuê.',
    noiDung:
      '<div class="the-tai-khoan">' +
        '<div><h4>Tên đăng nhập</h4><p class="ma-don">' + thoat(ten) + '</p>' +
        '<p>Trạng thái: ' + nhanTaiKhoan(u) + '</p></div>' +
        (u ? '<div><h4>Mật khẩu</h4><p>' + (u.phaiDoiMatKhau ? 'Đang dùng mật khẩu tạm' : 'Khách đã tự đổi mật khẩu') + '</p></div>' : '') +
      '</div>' +
      '<p class="ghi-chu-nho">' + (DL.cheDoSupabase
        ? 'Khách thuê kích hoạt tài khoản qua liên kết gửi tới email.'
        : 'Mật khẩu tạm chỉ hiển thị một lần. Khách sẽ buộc đổi mật khẩu ở lần đăng nhập kế tiếp.') + '</p>',
    chanTrang:
      (u
        ? '<button class="nut nut--ngoc" data-dong>Đóng</button>' +
          '<button class="nut nut--ngoc" id="tkKhoa">' + (u.trangThai === 'khoa' ? 'Mở khóa' : 'Khóa tài khoản') + '</button>' +
          '<button class="nut nut--chinh" id="tkDatLai">Đặt lại mật khẩu</button>'
        : '<button class="nut nut--ngoc" data-dong>Đóng</button>' +
          '<button class="nut nut--chinh" id="tkCap">Cấp tài khoản</button>')
  });

  if (!u) {
    document.getElementById('tkCap').onclick = function () { capTaiKhoanKhach(k, lamMoi); };
    return;
  }

  document.getElementById('tkDatLai').onclick = async function () {
    const dongY = await hoi('Đặt lại mật khẩu?', DL.cheDoSupabase
      ? 'Một liên kết đặt mật khẩu mới sẽ được gửi tới email của khách thuê.'
      : 'Mật khẩu hiện tại sẽ bị thay bằng mật khẩu tạm mới.', 'Đặt lại');
    if (!dongY) return;
    try {
      await DL.datLaiMatKhau(u.id);
      thongBao('Đã gửi email đặt lại mật khẩu tới ' + u.tenDangNhap + '.');
    } catch (loi) {
      console.error('Gửi email đặt lại mật khẩu thất bại:', loi);
      thongBao('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.', 'loi');
    }
  };

  document.getElementById('tkKhoa').onclick = async function () {
    const khoa = u.trangThai !== 'khoa';
    const dongY = await hoi(
      khoa ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
      khoa ? 'Khách sẽ không đăng nhập được cho tới khi được mở khóa.' : 'Khách có thể đăng nhập trở lại.',
      khoa ? 'Khóa' : 'Mở khóa'
    );
    if (!dongY) return;
    DL.khoaTaiKhoan(u.id, khoa);
    thongBao(khoa ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    lamMoi();
  };
}

/* Xóa khách, chặn nếu đã có hợp đồng, hóa đơn hoặc sự cố */
async function xoaKhach(id, xong) {
  const k = DL.tim('khach', id);
  if (!k) return;
  const coDuLieu =
    DL.lay('hopdong').some(function (h) { return h.khachId === id; }) ||
    DL.lay('hoadon').some(function (h) { return h.khachId === id; }) ||
    DL.lay('suco').some(function (s) { return s.khachId === id; });
  if (coDuLieu) {
    await hoi('Không thể xóa khách', 'Khách <b>' + thoat(k.hoTen) + '</b> đã có hợp đồng, hóa đơn hoặc sự cố. Hãy chuyển trạng thái “Đã rời đi” thay vì xóa.', 'Đã hiểu');
    return;
  }
  if (!(await hoi('Xóa hồ sơ khách?', 'Hồ sơ của <b>' + thoat(k.hoTen) + '</b> sẽ bị xóa. Tài khoản đăng nhập (nếu có) cũng bị xóa.', 'Xóa hồ sơ'))) return;
  const u = taiKhoanCuaKhach(k);
  if (u) DL.xoa('nguoidung', u.id);
  DL.xoa('khach', id);
  thongBao('Đã xóa hồ sơ khách.');
  if (xong) xong();
}

/* ============================================================
   MÀN HÌNH HỢP ĐỒNG
   ============================================================ */

/* Cộng thêm số tháng vào một ngày ISO */
function themThang(iso, soThang) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + Number(soThang || 0));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Trạng thái hiển thị của hợp đồng */
function trangThaiHopDong(h) {
  if (h.trangThai === 'ketthuc') return { chu: 'Đã kết thúc', loai: '' };
  const con = soNgayCon(h.ngayKetThuc);
  if (con < 0) return { chu: 'Đã hết hạn', loai: 'do' };
  if (con <= 30) return { chu: 'Sắp hết hạn · ' + con + ' ngày', loai: 'cam' };
  return { chu: 'Đang hiệu lực · còn ' + con + ' ngày', loai: 'xanh-la' };
}

function nhanHopDong(h) {
  const tt = trangThaiHopDong(h);
  return nhan(tt.chu, tt.loai);
}

function manHopDong(quyen) {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Hợp đồng', 'Lập, theo dõi thời hạn, in và thanh lý hợp đồng thuê phòng.',
        '<button class="nut nut--chinh" id="themHopDong">Tạo hợp đồng</button>') +
      '<div class="toolbar">' +
        '<div class="toolbar__trai">' +
          oTim('timHopDong', 'Tìm mã, phòng, tên khách…', TT.hopdong.tim) +
          '<div class="nhom-chip" id="chipHopDong">' +
            chipLoc('tatca', 'Tất cả', TT.hopdong.loc === 'tatca') +
            chipLoc('hieuluc', 'Đang hiệu lực', TT.hopdong.loc === 'hieuluc') +
            chipLoc('saphet', 'Sắp hết hạn', TT.hopdong.loc === 'saphet') +
            chipLoc('hethan', 'Đã hết hạn', TT.hopdong.loc === 'hethan') +
            chipLoc('ketthuc', 'Đã kết thúc', TT.hopdong.loc === 'ketthuc') +
          '</div>' +
        '</div>' +
        '<span class="dem" id="demHopDong"></span>' +
      '</div>' +
      '<div id="khuHopDong"></div>' +
    '</div>';

  veHopDong(quyen);

  document.getElementById('themHopDong').onclick = function () {
    moFormHopDong(quyen, function () { veHopDong(quyen); });
  };
  ganTim('timHopDong', function (v) { TT.hopdong.tim = v; veHopDong(quyen); });
  ganChip('chipHopDong', function (loc) {
    TT.hopdong.loc = loc;
    document.querySelectorAll('#chipHopDong .chip').forEach(function (b) {
      b.classList.toggle('dang-chon', b.dataset.loc === loc);
    });
    veHopDong(quyen);
  });
}

function veHopDong(quyen) {
  const khu = document.getElementById('khuHopDong');
  if (!khu) return;
  const tatCa = DL.lay('hopdong');
  const tim = TT.hopdong.tim.toLowerCase();

  function thuocLoc(h) {
    if (TT.hopdong.loc === 'tatca') return true;
    if (TT.hopdong.loc === 'ketthuc') return h.trangThai === 'ketthuc';
    if (h.trangThai === 'ketthuc') return false;
    const con = soNgayCon(h.ngayKetThuc);
    if (TT.hopdong.loc === 'hieuluc') return con >= 0;
    if (TT.hopdong.loc === 'saphet') return con >= 0 && con <= 30;
    if (TT.hopdong.loc === 'hethan') return con < 0;
    return true;
  }

  const ds = tatCa.filter(function (h) {
    if (!thuocLoc(h)) return false;
    if (!tim) return true;
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    return [h.ma, p ? p.ma : '', p ? p.ten : '', k ? k.hoTen : ''].join(' ').toLowerCase().indexOf(tim) >= 0;
  }).sort(function (a, b) { return a.ma < b.ma ? 1 : -1; });

  const demHieuLuc = tatCa.filter(function (h) { return h.trangThai === 'hieuluc' && soNgayCon(h.ngayKetThuc) >= 0; }).length;
  const demSapHet = tatCa.filter(function (h) { return h.trangThai === 'hieuluc' && soNgayCon(h.ngayKetThuc) >= 0 && soNgayCon(h.ngayKetThuc) <= 30; }).length;
  const demHetHan = tatCa.filter(function (h) { return h.trangThai === 'hieuluc' && soNgayCon(h.ngayKetThuc) < 0; }).length;
  const demKetThuc = tatCa.filter(function (h) { return h.trangThai === 'ketthuc'; }).length;

  const dong = ds.map(function (h) {
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    return [
      '<strong>' + thoat(h.ma) + '</strong>',
      p ? '<div>' + thoat(p.ma) + '</div><div class="phu">' + thoat(p.ten) + '</div>' : '—',
      k ? thoat(k.hoTen) : '—',
      '<div>' + ngay(h.ngayBatDau) + ' → ' + ngay(h.ngayKetThuc) + '</div><div class="phu">Ký ' + ngay(h.ngayKy) + '</div>',
      '<span class="so">' + tien(h.tienThue) + '</span>',
      '<span class="so">' + tien(h.tienCoc) + '</span>',
      nhanHopDong(h),
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-xem="' + h.id + '">Chi tiết</button>' +
        '<button class="nut nut--ngoc nut--nho" data-in="' + h.id + '">In</button>' +
        (h.trangThai === 'hieuluc' ? '<button class="nut nut--xoa" data-thanh-ly="' + h.id + '">Thanh lý</button>' : '') +
      '</div>'
    ];
  });

  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Đang hiệu lực', so: demHieuLuc, lop: 'thong-ke__so--la' },
      { nhan: 'Sắp hết hạn', so: demSapHet, lop: 'thong-ke__so--xanh' },
      { nhan: 'Đã hết hạn', so: demHetHan, lop: 'thong-ke__so--do' },
      { nhan: 'Đã kết thúc', so: demKetThuc }
    ]) +
    bangHtml(['Mã', 'Phòng', 'Khách', 'Thời hạn', 'Tiền thuê', 'Tiền cọc', 'Trạng thái', ''], dong);

  const oDem = document.getElementById('demHopDong');
  if (oDem) oDem.textContent = ds.length + ' hợp đồng';

  khu.onclick = function (e) {
    const xem = e.target.closest('[data-xem]');
    const inAn = e.target.closest('[data-in]');
    const thanhLy = e.target.closest('[data-thanh-ly]');
    if (xem) manHopDongChiTiet(xem.dataset.xem, quyen);
    if (inAn) inHopDong(DL.tim('hopdong', inAn.dataset.in));
    if (thanhLy) xuLyThanhLy(DL.tim('hopdong', thanhLy.dataset.thanhLy), function () { veHopDong(quyen); });
  };
}

/* Xem chi tiết hợp đồng */
function manHopDongChiTiet(id, quyen) {
  const h = DL.tim('hopdong', id);
  const khu = document.getElementById('noidung');
  if (!h) {
    khu.innerHTML = '<div class="man">' + trangTrong('Không tìm thấy hợp đồng', 'Hợp đồng có thể đã bị xóa.') + '</div>';
    return;
  }
  const p = DL.tim('phong', h.phongId);
  const k = DL.tim('khach', h.khachId);
  const tt = trangThaiHopDong(h);

  khu.innerHTML =
    '<div class="man">' +
      '<div class="man__dau">' +
        '<div>' +
          '<button class="nut nut--rong" id="quayLaiHopDong" style="font-size:13px">← Danh sách hợp đồng</button>' +
          '<h1 style="margin-top:8px">' + thoat(h.ma) + '</h1>' +
          '<p class="mo-ta">' + (p ? thoat(p.ma) + ' · ' + thoat(p.ten) : '') + ' · ' + (k ? thoat(k.hoTen) : '') + ' · ' + nhan(tt.chu, tt.loai) + '</p>' +
        '</div>' +
        '<div class="man__nut">' +
          '<button class="nut nut--ngoc" id="inHopDongChiTiet">In hợp đồng</button>' +
          (h.trangThai === 'hieuluc' ? '<button class="nut nut--chinh" id="thanhLyChiTiet">Thanh lý hợp đồng</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="luoi luoi--2" style="margin-top:24px">' +
        '<div class="the"><div class="the__dau"><h3>Hợp đồng và tài sản thuê</h3></div>' +
          danhSachMoTa([
            ['Mã hợp đồng', thoat(h.ma)],
            ['Địa chỉ nhà trọ', thoat(h.diaChiChuNha)],
            ['Phòng', p ? thoat(p.ma) + ' — ' + thoat(p.ten) : '—'],
            ['Diện tích', p ? thoat(p.dienTich) + ' m²' : '—'],
            ['Mục đích thuê', thoat(h.mucDich)]
          ]) +
        '</div>' +
        '<div class="the"><div class="the__dau"><h3>Bên cho thuê</h3></div>' +
          danhSachMoTa([
            ['Họ tên', thoat(h.chuNha)],
            ['CCCD', thoat(h.cccdChuNha)],
            ['Địa chỉ', thoat(h.diaChiChuNha)],
            ['Điện thoại', thoat(h.sdtChuNha)]
          ]) +
        '</div>' +
        '<div class="the"><div class="the__dau"><h3>Bên thuê đại diện</h3></div>' +
          danhSachMoTa([
            ['Họ tên', k ? thoat(k.hoTen) : '—'],
            ['CCCD', k ? thoat(k.cccd) : '—'],
            ['Điện thoại', k ? thoat(k.sdt) : '—'],
            ['Địa chỉ', k ? thoat(k.diaChi) : '—'],
            ['Người ở cùng', thoat(h.nguoiOCung)],
            ['Số người tối đa', thoat(h.soNguoiToiDa)]
          ]) +
        '</div>' +
        '<div class="the"><div class="the__dau"><h3>Thời hạn và thanh toán</h3></div>' +
          danhSachMoTa([
            ['Thời hạn', ngay(h.ngayBatDau) + ' → ' + ngay(h.ngayKetThuc)],
            ['Tiền thuê', tien(h.tienThue) + ' / tháng'],
            ['Tiền cọc', tien(h.tienCoc)],
            ['Hạn thanh toán', 'Ngày ' + thoat(h.hanThanhToan) + ' hằng tháng'],
            ['Phương thức', thoat(h.phuongThuc)],
            ['Tài khoản nhận tiền', thoat(h.taiKhoanNhan)],
            ['Giá điện / nước', tien(h.giaDien) + ' / kWh · ' + tien(h.giaNuoc) + ' / m³'],
            ['Phí dịch vụ', tien(h.phiDichVu) + ' / tháng']
          ]) +
        '</div>' +
      '</div>' +
      '<div class="the" style="margin-top:18px"><div class="the__dau"><h3>Bàn giao</h3></div>' +
        danhSachMoTa([
          ['Ngày bàn giao', ngay(h.ngayBanGiao)],
          ['Hiện trạng phòng / thiết bị', thoat(h.hienTrang)],
          ['Chỉ số bàn giao', thoat(h.chiSoBanGiao)]
        ]) +
      '</div>' +
      '<div class="the" style="margin-top:18px"><div class="the__dau"><h3>Quyền, nghĩa vụ và chấm dứt</h3></div>' +
        danhSachMoTa([
          ['Quyền và nghĩa vụ', thoat(h.dieuKhoan)],
          ['Báo trước khi chấm dứt', thoat(h.soNgayBaoTruoc) + ' ngày'],
          ['Hoàn cọc trong', thoat(h.soNgayHoanCoc) + ' ngày'],
          ['Điều kiện chấm dứt sớm', thoat(h.dieuKienChamDut)],
          ['Khấu trừ cọc', thoat(h.khauTruCoc)],
          ['Thỏa thuận trễ hạn', thoat(h.xuLyTreHan)],
          ['Giải quyết tranh chấp', thoat(h.tranhChap)],
          ['Thỏa thuận bổ sung', thoat(h.boSung)],
          ['Ngày ký', ngay(h.ngayKy)]
        ]) +
      '</div>' +
      '<p class="ghi-chu-nho">Hợp đồng được in đầy đủ hai bên, điều khoản và chữ ký bằng nút “In hợp đồng”.</p>' +
    '</div>';

  document.getElementById('quayLaiHopDong').onclick = function () { manHopDong(quyen); };
  document.getElementById('inHopDongChiTiet').onclick = function () { inHopDong(h); };
  const nutThanhLy = document.getElementById('thanhLyChiTiet');
  if (nutThanhLy) {
    nutThanhLy.onclick = function () {
      xuLyThanhLy(h, function () { manHopDongChiTiet(h.id, quyen); });
    };
  }
}

/* Thanh lý hợp đồng: kết thúc và cập nhật trạng thái phòng */
async function xuLyThanhLy(h, xong) {
  if (!h) return;
  const dongY = await hoi(
    'Thanh lý hợp đồng?',
    'Hợp đồng <b>' + thoat(h.ma) + '</b> sẽ chuyển sang “Đã kết thúc” và phòng được cập nhật lại. Hãy đối chiếu công nợ, tiền cọc và tài sản bàn giao trước khi xác nhận.',
    'Thanh lý'
  );
  if (!dongY) return;
  DL.sua('hopdong', h.id, { trangThai: 'ketthuc' });
  DL.dongBoPhong();
  thongBao('Đã thanh lý hợp đồng. Phòng đã được cập nhật trạng thái.');
  if (xong) xong();
}

/* Biểu mẫu tạo hợp đồng: bản đầy đủ cho chủ trọ, bản gọn cho quản lý */
function moFormHopDong(quyen, xong) {
  const phongTrong = DL.lay('phong').filter(function (p) { return !DL.hopDongHieuLuc(p.id); })
    .sort(function (a, b) { return a.ma.localeCompare(b.ma); });
  if (!phongTrong.length) {
    thongBao('Hiện không còn phòng trống để lập hợp đồng.', 'loi');
    return;
  }
  const khachDS = DL.lay('khach').filter(function (k) { return k.trangThai === 'dangthue'; })
    .sort(function (a, b) { return a.hoTen.localeCompare(b.hoTen); });
  if (!khachDS.length) {
    thongBao('Chưa có khách thuê đang hoạt động để lập hợp đồng.', 'loi');
    return;
  }

  const soThuTu = String(DL.soBanGhiToanBo('hopdong') + 1).padStart(3, '0');
  const maGoiY = 'HĐ-' + new Date().getFullYear() + '-' + soThuTu;
  const hdMau = DL.lay('hopdong')[0] || {};
  const dvDien = DL.lay('dichvu').find(function (d) { return d.ten === 'Điện'; });
  const dvNuoc = DL.lay('dichvu').find(function (d) { return d.ten === 'Nước'; });
  const giaDien = dvDien ? dvDien.donGia : 3500;
  const giaNuoc = dvNuoc ? dvNuoc.donGia : 15000;
  const batDau = homNay();

  const dsPhong = phongTrong.map(function (p) {
    return '<option value="' + p.id + '" data-gia="' + p.gia + '">' + thoat(p.ma) + ' — ' + thoat(p.ten) + ' · ' + tien(p.gia) + '</option>';
  }).join('');

  const dsKhach = khachDS.map(function (k) {
    return '<option value="' + k.id + '">' + thoat(k.hoTen) + ' — ' + thoat(k.sdt) + '</option>';
  }).join('');

  const truongChung =
    '<div class="nhom"><label for="fhPhong">Phòng cho thuê *</label><select id="fhPhong" class="o-chon">' + dsPhong + '</select></div>' +
    '<div class="nhom"><label for="fhKhach">Khách đại diện *</label><select id="fhKhach" class="o-chon">' + dsKhach + '</select></div>' +
    '<div class="nhom"><label for="fhBatDau">Ngày bắt đầu *</label><input id="fhBatDau" type="date" class="o-nhap" value="' + batDau + '"></div>';

  const nhomThoiHan = quyen.hopDongDayDu
    ? '<div class="nhom"><label for="fhKetThuc">Ngày kết thúc *</label><input id="fhKetThuc" type="date" class="o-nhap" value="' + themThang(batDau, 12) + '"></div>'
    : '<div class="nhom"><label for="fhThoiHan">Thời hạn *</label><select id="fhThoiHan" class="o-chon">' +
        '<option value="6">6 tháng</option><option value="12" selected>12 tháng</option><option value="24">24 tháng</option>' +
      '</select></div>';

  const phanDayDu =
    '<div class="nhom-thong-tin"><h3>Hợp đồng và tài sản thuê</h3><div class="luoi-nhap">' +
      '<div class="nhom"><label for="fhMa">Mã hợp đồng</label><input id="fhMa" class="o-nhap" value="' + thoat(maGoiY) + '" readonly></div>' +
      '<div class="nhom"><label for="fhDiaChiNha">Địa chỉ nhà trọ</label><input id="fhDiaChiNha" class="o-nhap" value="' + thoat(hdMau.diaChiChuNha || '') + '"></div>' +
      '<div class="nhom"><label for="fhMucDich">Mục đích thuê</label><input id="fhMucDich" class="o-nhap" value="Để ở"></div>' +
      '</div></div>' +
    '<div class="nhom-thong-tin"><h3>Bên cho thuê</h3><div class="luoi-nhap">' +
      '<div class="nhom"><label for="fhChuNha">Họ tên chủ nhà</label><input id="fhChuNha" class="o-nhap" value="' + thoat(hdMau.chuNha || '') + '"></div>' +
      '<div class="nhom"><label for="fhCccdChu">CCCD chủ nhà</label><input id="fhCccdChu" class="o-nhap" value="' + thoat(hdMau.cccdChuNha || '') + '"></div>' +
      '<div class="nhom rong"><label for="fhDiaChiChu">Địa chỉ chủ nhà</label><input id="fhDiaChiChu" class="o-nhap" value="' + thoat(hdMau.diaChiChuNha || '') + '"></div>' +
      '<div class="nhom"><label for="fhSdtChu">Số điện thoại chủ nhà</label><input id="fhSdtChu" class="o-nhap" value="' + thoat(hdMau.sdtChuNha || '') + '"></div>' +
      '</div></div>' +
    '<div class="nhom-thong-tin"><h3>Bên thuê đại diện</h3><div class="luoi-nhap">' +
      '<div class="nhom"><label for="fhTenThue">Họ tên</label><input id="fhTenThue" class="o-nhap"></div>' +
      '<div class="nhom"><label for="fhCccdThue">CCCD</label><input id="fhCccdThue" class="o-nhap"></div>' +
      '<div class="nhom"><label for="fhSdtThue">Số điện thoại</label><input id="fhSdtThue" class="o-nhap"></div>' +
      '<div class="nhom"><label for="fhDiaChiThue">Địa chỉ</label><input id="fhDiaChiThue" class="o-nhap"></div>' +
      '<div class="nhom"><label for="fhOCung">Người ở cùng</label><input id="fhOCung" class="o-nhap" placeholder="Họ tên, quan hệ"></div>' +
      '<div class="nhom"><label for="fhSoNguoi">Số người tối đa</label><input id="fhSoNguoi" type="number" min="1" class="o-nhap" value="2"></div>' +
      '</div></div>' +
    '<div class="nhom-thong-tin"><h3>Thời hạn, tiền và thanh toán</h3><div class="luoi-nhap">' +
      nhomThoiHan +
      '<div class="nhom"><label for="fhTienThue">Tiền thuê / tháng *</label><input id="fhTienThue" type="number" min="0" step="1000" class="o-nhap"></div>' +
      '<div class="nhom"><label for="fhTienCoc">Tiền cọc</label><input id="fhTienCoc" type="number" min="0" step="1000" class="o-nhap"></div>' +
      '<div class="nhom"><label for="fhHan">Hạn thanh toán</label><select id="fhHan" class="o-chon">' +
        Array.from({ length: 28 }, function (_, i) { return '<option value="' + (i + 1) + '"' + (i + 1 === 5 ? ' selected' : '') + '>Ngày ' + (i + 1) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="nhom"><label for="fhPhuongThuc">Phương thức</label><select id="fhPhuongThuc" class="o-chon">' +
        '<option>Chuyển khoản</option><option>Tiền mặt</option><option>Khác</option></select></div>' +
      '<div class="nhom rong"><label for="fhTaiKhoan">Tài khoản nhận tiền</label><input id="fhTaiKhoan" class="o-nhap" value="' + thoat(hdMau.taiKhoanNhan || '') + '"></div>' +
      '<div class="nhom"><label for="fhGiaDien">Giá điện (/kWh)</label><input id="fhGiaDien" type="number" min="0" class="o-nhap" value="' + giaDien + '"></div>' +
      '<div class="nhom"><label for="fhGiaNuoc">Giá nước (/m³)</label><input id="fhGiaNuoc" type="number" min="0" class="o-nhap" value="' + giaNuoc + '"></div>' +
      '<div class="nhom"><label for="fhPhiDv">Phí dịch vụ / tháng</label><input id="fhPhiDv" type="number" min="0" step="1000" class="o-nhap" value="100000"></div>' +
      '</div></div>' +
    '<div class="nhom-thong-tin"><h3>Bàn giao, điều khoản và chấm dứt</h3><div class="luoi-nhap">' +
      '<div class="nhom"><label for="fhBanGiao">Ngày bàn giao</label><input id="fhBanGiao" type="date" class="o-nhap" value="' + batDau + '"></div>' +
      '<div class="nhom"><label for="fhChiSo">Chỉ số bàn giao</label><input id="fhChiSo" class="o-nhap" placeholder="VD: Điện 1.200 kWh · Nước 300 m³"></div>' +
      '<div class="nhom rong"><label for="fhHienTrang">Hiện trạng phòng / thiết bị / chìa khóa</label><textarea id="fhHienTrang" class="o-vung">Sàn gạch, tường sơn, 1 máy lạnh, 1 nóng lạnh, 2 chìa khóa.</textarea></div>' +
      '<div class="nhom rong"><label for="fhDieuKhoan">Quyền, nghĩa vụ và nội quy</label><textarea id="fhDieuKhoan" class="o-vung">Thanh toán đúng hạn hằng tháng. Giữ gìn tài sản, không tự ý sửa kết cấu. Giữ trật tự sau 22 giờ.</textarea></div>' +
      '<div class="nhom"><label for="fhBaoTruoc">Số ngày báo trước</label><input id="fhBaoTruoc" type="number" min="0" class="o-nhap" value="30"></div>' +
      '<div class="nhom"><label for="fhHoanCoc">Số ngày hoàn cọc</label><input id="fhHoanCoc" type="number" min="0" class="o-nhap" value="15"></div>' +
      '<div class="nhom rong"><label for="fhChamDut">Điều kiện chấm dứt sớm và khấu trừ cọc</label><textarea id="fhChamDut" class="o-vung">Chấm dứt khi vi phạm nội quy hoặc chậm thanh toán quá 15 ngày. Khấu trừ hư hỏng và công nợ.</textarea></div>' +
      '<div class="nhom rong"><label for="fhTreHan">Thỏa thuận trễ hạn, tranh chấp, bổ sung</label><textarea id="fhTreHan" class="o-vung">Phí chậm thanh toán 0,1%/ngày. Tranh chấp ưu tiên thương lượng.</textarea></div>' +
      '<div class="nhom"><label for="fhNgayKy">Ngày ký</label><input id="fhNgayKy" type="date" class="o-nhap" value="' + homNay() + '"></div>' +
      '<div class="nhom"><label for="fhTrangThai">Trạng thái</label><select id="fhTrangThai" class="o-chon"><option value="hieuluc">Đang hiệu lực</option><option value="ketthuc">Đã kết thúc</option></select></div>' +
      '</div></div>';

  const phanGon =
    '<div class="nhom-thong-tin"><h3>Thông tin hợp đồng</h3><div class="luoi-nhap">' +
      '<div class="nhom rong"><label for="fhMa">Mã hợp đồng</label><input id="fhMa" class="o-nhap" value="' + thoat(maGoiY) + '" readonly></div>' +
      nhomThoiHan +
      '<div class="nhom"><label for="fhTienThue">Tiền thuê / tháng *</label><input id="fhTienThue" type="number" min="0" step="1000" class="o-nhap"></div>' +
      '<div class="nhom"><label for="fhTienCoc">Tiền cọc</label><input id="fhTienCoc" type="number" min="0" step="1000" class="o-nhap"></div>' +
      '<div class="nhom rong"><label for="fhHienTrang">Thiết bị bàn giao</label><textarea id="fhHienTrang" class="o-vung" placeholder="Máy lạnh, nóng lạnh, tủ quần áo…"></textarea></div>' +
      '<div class="nhom rong"><label for="fhDieuKhoan">Điều khoản thêm / ghi chú</label><textarea id="fhDieuKhoan" class="o-vung"></textarea></div>' +
      '</div></div>';

  const lop = moHop({
    rong: true,
    tieuDe: 'Tạo hợp đồng thuê',
    moTa: quyen.hopDongDayDu
      ? 'Điền đủ năm nhóm thông tin. Các trường có dấu * là bắt buộc.'
      : 'Chọn phòng còn trống, khách đại diện, ngày bắt đầu và thời hạn. Hệ thống tự tính ngày kết thúc.',
    noiDung:
      '<form class="bieu-mau" id="formHopDong">' +
        '<div class="nhom-thong-tin"><h3>Phòng và khách thuê</h3><div class="luoi-nhap">' +
          truongChung +
          (quyen.hopDongDayDu ? '' : '<div class="nhom rong"><p class="goi-y">Khách đại diện, ngày bắt đầu và thời hạn là bắt buộc. Các thông tin khác lấy theo mặc định của nhà trọ.</p></div>') +
        '</div></div>' +
        (quyen.hopDongDayDu ? phanDayDu : phanGon) +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuHopDong">Tạo hợp đồng</button>'
  });

  /* Điền sẵn thông tin khi chọn phòng / khách */
  const oPhong = document.getElementById('fhPhong');
  const oKhach = document.getElementById('fhKhach');
  const oTienThue = document.getElementById('fhTienThue');

  oPhong.onchange = function () {
    const p = DL.tim('phong', oPhong.value);
    if (p) {
      oTienThue.value = p.gia;
      const oCoc = document.getElementById('fhTienCoc');
      if (oCoc) oCoc.value = p.gia * 2;
    }
  };
  oPhong.onchange();

  oKhach.onchange = function () {
    const k = DL.tim('khach', oKhach.value);
    if (!k) return;
    const ten = document.getElementById('fhTenThue');
    const cccd = document.getElementById('fhCccdThue');
    const sdt = document.getElementById('fhSdtThue');
    const diaChi = document.getElementById('fhDiaChiThue');
    if (ten) ten.value = k.hoTen;
    if (cccd) cccd.value = k.cccd || '';
    if (sdt) sdt.value = k.sdt || '';
    if (diaChi) diaChi.value = k.diaChi || '';
  };
  oKhach.onchange();

  const oBatDau = document.getElementById('fhBatDau');
  oBatDau.onchange = function () {
    const oKetThuc = document.getElementById('fhKetThuc');
    if (oKetThuc) oKetThuc.value = themThang(oBatDau.value, 12);
    const oBanGiao = document.getElementById('fhBanGiao');
    if (oBanGiao) oBanGiao.value = oBatDau.value;
  };

  document.getElementById('luuHopDong').onclick = function () {
    const phongId = giaTri('fhPhong');
    const khachId = giaTri('fhKhach');
    const batDau = giaTri('fhBatDau');
    const ma = giaTri('fhMa');
    let ketThuc = '';
    if (quyen.hopDongDayDu) ketThuc = giaTri('fhKetThuc');
    else ketThuc = themThang(batDau, Number(giaTri('fhThoiHan')) || 12);

    if (!phongId || !khachId || !batDau) { thongBao('Vui lòng chọn phòng, khách và ngày bắt đầu.', 'loi'); return; }
    if (!ketThuc || ketThuc < batDau) { thongBao('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.', 'loi'); return; }
    if (DL.hopDongHieuLuc(phongId)) { thongBao('Phòng này đang có hợp đồng hiệu lực.', 'loi'); return; }
    if (DL.giaTriDaTonTai('hopdong', 'ma', ma)) {
      thongBao('Mã hợp đồng đã tồn tại.', 'loi'); return;
    }
    const tienThue = soGiaTri('fhTienThue');
    if (tienThue < 0) { thongBao('Tiền thuê không được âm.', 'loi'); return; }

    const khach = DL.tim('khach', khachId);
    const dvDien = DL.lay('dichvu').find(function (d) { return d.ten === 'Điện'; });
    const dvNuoc = DL.lay('dichvu').find(function (d) { return d.ten === 'Nước'; });

    const du = {
      ma: ma, phongId: phongId, khachId: khachId,
      ngayBatDau: batDau, ngayKetThuc: ketThuc, ngayKy: giaTri('fhNgayKy') || homNay(),
      tienThue: tienThue, tienCoc: soGiaTri('fhTienCoc'),
      hanThanhToan: Number(giaTri('fhHan')) || 5,
      phuongThuc: giaTri('fhPhuongThuc') || 'Chuyển khoản',
      taiKhoanNhan: giaTri('fhTaiKhoan') || 'Nhận tại văn phòng',
      giaDien: quyen.hopDongDayDu ? soGiaTri('fhGiaDien') : (dvDien ? dvDien.donGia : 3500),
      giaNuoc: quyen.hopDongDayDu ? soGiaTri('fhGiaNuoc') : (dvNuoc ? dvNuoc.donGia : 15000),
      phiDichVu: quyen.hopDongDayDu ? soGiaTri('fhPhiDv') : 100000,
      mucDich: giaTri('fhMucDich') || 'Để ở',
      soNguoiToiDa: quyen.hopDongDayDu ? soGiaTri('fhSoNguoi') : 2,
      nguoiOCung: giaTri('fhOCung'),
      ngayBanGiao: giaTri('fhBanGiao') || batDau,
      hienTrang: giaTri('fhHienTrang'),
      chiSoBanGiao: giaTri('fhChiSo'),
      soNgayBaoTruoc: quyen.hopDongDayDu ? soGiaTri('fhBaoTruoc') : 30,
      soNgayHoanCoc: quyen.hopDongDayDu ? soGiaTri('fhHoanCoc') : 15,
      dieuKhoan: giaTri('fhDieuKhoan'),
      dieuKienChamDut: quyen.hopDongDayDu ? giaTri('fhChamDut') : 'Chấm dứt khi vi phạm nội quy hoặc chậm thanh toán quá 15 ngày.',
      khauTruCoc: quyen.hopDongDayDu ? '' : 'Khấu trừ hư hỏng tài sản và công nợ.',
      xuLyTreHan: quyen.hopDongDayDu ? giaTri('fhTreHan') : 'Phí chậm thanh toán 0,1%/ngày.',
      tranhChap: 'Ưu tiên thương lượng, sau đó giải quyết theo pháp luật.',
      boSung: quyen.hopDongDayDu ? '' : giaTri('fhDieuKhoan'),
      chuNha: giaTri('fhChuNha') || 'Nguyễn Văn Chủ',
      cccdChuNha: giaTri('fhCccdChu') || '079080001111',
      diaChiChuNha: giaTri('fhDiaChiNha') || giaTri('fhDiaChiChu') || '18 Nguyễn Trãi, Quận 1, TP. HCM',
      sdtChuNha: giaTri('fhSdtChu') || '0909000111',
      trangThai: giaTri('fhTrangThai') || 'hieuluc'
    };

    DL.them('hopdong', du);
    DL.sua('phong', phongId, { trangThai: 'dangthue' });
    if (khach) DL.sua('khach', khachId, {
      phongId: phongId, coSoId: (DL.tim('phong', phongId) || {}).coSoId,
      ngayVao: batDau, trangThai: 'dangthue'
    });
    DL.dongBoPhong();

    dongHop();
    thongBao('Đã tạo hợp đồng ' + ma + '. Phòng chuyển sang “Đang thuê”.');
    if (xong) xong();
  };
}

/* ============================================================
   HÓA ĐƠN VÀ THANH TOÁN
   ============================================================ */

function manHoaDon(quyen) {
  const khu = document.getElementById('noidung');
  const cacKy = Array.from(new Set(DL.lay('hoadon').map(function (h) { return h.ky; })))
    .sort(function (a, b) { return a < b ? 1 : -1; });

  khu.innerHTML =
    '<div class="man">' +
      dauMan('Hóa đơn', 'Lập hóa đơn theo kỳ, ghi nhận thanh toán nhiều lần và theo dõi công nợ.',
        '<button class="nut nut--chinh" id="themHoaDon">Tạo hóa đơn</button>') +
      '<div class="toolbar">' +
        '<div class="toolbar__trai">' +
          oTim('timHoaDon', 'Tìm mã, kỳ, phòng, khách…', TT.hoadon.tim) +
          '<select id="kyHoaDon" class="o-loc">' +
            '<option value="">Tất cả kỳ</option>' +
            cacKy.map(function (k) {
              return '<option value="' + k + '"' + (TT.hoadon.ky === k ? ' selected' : '') + '>Kỳ ' + kyDep(k) + '</option>';
            }).join('') +
          '</select>' +
          '<div class="nhom-chip" id="chipHoaDon">' +
            chipLoc('tatca', 'Tất cả', TT.hoadon.loc === 'tatca') +
            chipLoc('chua', 'Chưa thanh toán', TT.hoadon.loc === 'chua') +
            chipLoc('mot', 'Một phần', TT.hoadon.loc === 'mot') +
            chipLoc('da', 'Đã thanh toán', TT.hoadon.loc === 'da') +
            chipLoc('qua', 'Quá hạn', TT.hoadon.loc === 'qua') +
            chipLoc('huy', 'Đã hủy', TT.hoadon.loc === 'huy') +
          '</div>' +
        '</div>' +
        '<span class="dem" id="demHoaDon"></span>' +
      '</div>' +
      '<div id="khuHoaDon"></div>' +
    '</div>';

  veHoaDon(quyen);

  document.getElementById('themHoaDon').onclick = function () {
    moTaoHoaDon(quyen, function () { veHoaDon(quyen); });
  };
  ganTim('timHoaDon', function (v) { TT.hoadon.tim = v; veHoaDon(quyen); });
  document.getElementById('kyHoaDon').onchange = function (e) {
    TT.hoadon.ky = e.target.value;
    veHoaDon(quyen);
  };
  ganChip('chipHoaDon', function (loc) {
    TT.hoadon.loc = loc;
    document.querySelectorAll('#chipHoaDon .chip').forEach(function (b) {
      b.classList.toggle('dang-chon', b.dataset.loc === loc);
    });
    veHoaDon(quyen);
  });
}

function veHoaDon(quyen) {
  const khu = document.getElementById('khuHoaDon');
  if (!khu) return;
  const tatCa = DL.lay('hoadon');
  const tim = TT.hoadon.tim.toLowerCase();

  function khopTim(h) {
    if (!tim) return true;
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    return [h.ma, h.ky, kyDep(h.ky), p ? p.ma : '', p ? p.ten : '', k ? k.hoTen : ''].join(' ').toLowerCase().indexOf(tim) >= 0;
  }

  const dsKy = tatCa.filter(function (h) {
    if (TT.hoadon.ky && h.ky !== TT.hoadon.ky) return false;
    return khopTim(h);
  });

  const ds = dsKy.filter(function (h) {
    if (TT.hoadon.loc === 'tatca') return true;
    if (TT.hoadon.loc === 'huy') return h.trangThai === 'huy';
    if (h.trangThai === 'huy') return false;
    return DL.cotKanban(h) === TT.hoadon.loc;
  }).sort(function (a, b) {
    if (a.ky !== b.ky) return a.ky < b.ky ? 1 : -1;
    return a.ma.localeCompare(b.ma);
  });

  const hopLe = dsKy.filter(function (h) { return h.trangThai !== 'huy'; });
  const tongLap = hopLe.reduce(function (t, h) { return t + (Number(h.tong) || 0); }, 0);
  const tongThu = hopLe.reduce(function (t, h) { return t + DL.daThu(h.id); }, 0);
  const tongNo = hopLe.reduce(function (t, h) { return t + DL.conNo(h); }, 0);
  const soQuaHan = hopLe.filter(function (h) { return DL.trangThaiHoaDon(h).quaHan; }).length;

  const dong = ds.map(function (h) {
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
      '<span class="so' + (tt.con > 0 && h.trangThai !== 'huy' ? '' : '') + '">' + (h.trangThai === 'huy' ? '—' : tien(tt.con)) + '</span>',
      ngay(h.han),
      nhanHoaDon(h),
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-xem="' + h.id + '">Chi tiết</button>' +
        (h.trangThai !== 'huy' && tt.con > 0 ? '<button class="nut nut--ngoc nut--nho" data-thu="' + h.id + '">Thu tiền</button>' : '') +
      '</div>'
    ];
  });

  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Tổng đã lập', so: tien(tongLap), ghiChu: hopLe.length + ' hóa đơn' },
      { nhan: 'Đã thu', so: tien(tongThu), lop: 'thong-ke__so--la' },
      { nhan: 'Còn nợ', so: tien(tongNo), lop: 'thong-ke__so--do' },
      { nhan: 'Quá hạn', so: soQuaHan + ' hóa đơn', lop: 'thong-ke__so--do' }
    ]) +
    bangHtml(['Mã', 'Kỳ', 'Phòng', 'Khách', 'Tổng', 'Đã thu', 'Còn nợ', 'Hạn', 'Trạng thái', ''], dong);

  const oDem = document.getElementById('demHoaDon');
  if (oDem) oDem.textContent = ds.length + ' hóa đơn';

  khu.onclick = function (e) {
    const xem = e.target.closest('[data-xem]');
    const thu = e.target.closest('[data-thu]');
    if (xem) moChiTietHoaDon(DL.tim('hoadon', xem.dataset.xem), quyen, function () { veHoaDon(quyen); });
    if (thu) moThanhToan(DL.tim('hoadon', thu.dataset.thu), function () { veHoaDon(quyen); });
  };
}

/* Sinh mã hóa đơn duy nhất */
function sinhMaHoaDon(phong, ky) {
  const soPhong = String(phong.ma).replace(/[^0-9]/g, '') || '000';
  const goc = 'PT-' + soPhong + '-' + ky.slice(2, 4) + ky.slice(5, 7);
  let ma = goc;
  let i = 2;
  while (DL.lay('hoadon').some(function (h) { return h.ma === ma; })) {
    ma = goc + '-' + i;
    i++;
  }
  return ma;
}

/* Mở biểu mẫu lập hóa đơn. tuyChon = {ky, phongId} */
function moTaoHoaDon(quyen, xong, tuyChon) {
  tuyChon = tuyChon || {};
  const kyMacDinh = tuyChon.ky || thangNay();

  const lop = moHop({
    tieuDe: 'Tạo hóa đơn',
    moTa: 'Hệ thống lấy khách và đơn giá từ hợp đồng hiệu lực, tự tính tổng tiền.',
    noiDung:
      '<form class="bieu-mau" id="formHoaDon">' +
        '<div class="luoi-nhap">' +
          '<div class="nhom"><label for="fhKy">Kỳ hóa đơn *</label><input id="fhKy" type="month" class="o-nhap" value="' + kyMacDinh + '"></div>' +
          '<div class="nhom"><label for="fhPhongHd">Phòng *</label><select id="fhPhongHd" class="o-chon"></select></div>' +
          '<div class="nhom"><label for="fhHanHd">Hạn thanh toán</label><input id="fhHanHd" type="date" class="o-nhap" value="' + homNay() + '"></div>' +
          '<div class="nhom"><label for="fhSoDien">Sản lượng điện (kWh) *</label><input id="fhSoDien" type="number" min="0" step="1" class="o-nhap" value="0"></div>' +
          '<div class="nhom"><label for="fhSoNuoc">Sản lượng nước (m³) *</label><input id="fhSoNuoc" type="number" min="0" step="1" class="o-nhap" value="0"></div>' +
        '</div>' +
        '<div id="thongTinHopDongHd" class="khoi-tien"></div>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuHoaDon">Tạo hóa đơn</button>'
  });

  const oKy = document.getElementById('fhKy');
  const oPhong = document.getElementById('fhPhongHd');
  const oDien = document.getElementById('fhSoDien');
  const oNuoc = document.getElementById('fhSoNuoc');

  /* Chỉ phòng có hợp đồng hiệu lực và chưa có hóa đơn trong kỳ */
  function dienPhong() {
    const ky = oKy.value;
    const ds = DL.lay('phong').filter(function (p) {
      return DL.hopDongHieuLuc(p.id) && !DL.hoaDonTrongKy(p.id, ky);
    }).sort(function (a, b) { return a.ma.localeCompare(b.ma); });
    const chonTruoc = tuyChon.phongId && ds.some(function (p) { return p.id === tuyChon.phongId; }) ? tuyChon.phongId : '';
    if (!ds.length) {
      oPhong.innerHTML = '<option value="">Không còn phòng cần lập hóa đơn trong kỳ này</option>';
      return;
    }
    oPhong.innerHTML = ds.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === chonTruoc ? ' selected' : '') + '>' + thoat(p.ma) + ' — ' + thoat(p.ten) + '</option>';
    }).join('');
    capNhat();
  }

  function capNhat() {
    const p = DL.tim('phong', oPhong.value);
    const ky = oKy.value;
    const khuTt = document.getElementById('thongTinHopDongHd');
    if (!p) {
      khuTt.innerHTML = '<p class="chu-mo">Chọn phòng để xem thông tin hợp đồng.</p>';
      return;
    }
    const hd = DL.hopDongHieuLuc(p.id);
    if (!hd) {
      khuTt.innerHTML = '<p class="chu-mo">Phòng này chưa có hợp đồng hiệu lực.</p>';
      return;
    }
    const k = DL.tim('khach', hd.khachId);
    const g = DL.goiYChiSo(p.id, ky);
    const soDien = Number(oDien.value) || 0;
    const soNuoc = Number(oNuoc.value) || 0;
    const tinh = DL.tinhTong({
      tienThue: hd.tienThue, giaDien: hd.giaDien, giaNuoc: hd.giaNuoc,
      phiDichVu: hd.phiDichVu, soDien: soDien, soNuoc: soNuoc
    });
    khuTt.innerHTML =
      '<div class="dong-tien"><span>Khách thuê</span><b>' + thoat(k ? k.hoTen : '—') + '</b></div>' +
      '<div class="dong-tien"><span>Tiền phòng</span><b>' + tien(hd.tienThue) + '</b></div>' +
      '<div class="dong-tien"><span>Điện ' + soDien + ' kWh × ' + tien(hd.giaDien) + '</span><b>' + tien(tinh.tienDien) + '</b></div>' +
      '<div class="dong-tien"><span>Nước ' + soNuoc + ' m³ × ' + tien(hd.giaNuoc) + '</span><b>' + tien(tinh.tienNuoc) + '</b></div>' +
      '<div class="dong-tien"><span>Phí dịch vụ</span><b>' + tien(hd.phiDichVu) + '</b></div>' +
      '<div class="dong-tien dong-tien--tong"><span>Tổng cộng</span><b>' + tien(tinh.tong) + '</b></div>' +
      '<p class="ghi-chu-nho">Chỉ số đầu kỳ: điện ' + g.dienDau + ' · nước ' + g.nuocDau +
      (g.daChot ? ' · <b>đã chốt chỉ số trong kỳ</b>' : '') + '</p>';
  }

  function napChiSo() {
    const p = DL.tim('phong', oPhong.value);
    if (!p) return;
    const g = DL.goiYChiSo(p.id, oKy.value);
    if (g.daChot) {
      oDien.value = g.soDien;
      oNuoc.value = g.soNuoc;
    } else {
      oDien.value = 0;
      oNuoc.value = 0;
    }
    capNhat();
  }

  oKy.onchange = function () { dienPhong(); napChiSo(); };
  oPhong.onchange = function () { napChiSo(); };
  oDien.oninput = capNhat;
  oNuoc.oninput = capNhat;

  dienPhong();
  napChiSo();

  document.getElementById('luuHoaDon').onclick = function () {
    const p = DL.tim('phong', oPhong.value);
    const ky = oKy.value;
    if (!p) { thongBao('Vui lòng chọn phòng cần lập hóa đơn.', 'loi'); return; }
    if (!ky) { thongBao('Vui lòng chọn kỳ hóa đơn.', 'loi'); return; }
    if (DL.hoaDonTrongKy(p.id, ky)) { thongBao('Phòng này đã có hóa đơn trong kỳ ' + kyDep(ky) + '.', 'loi'); return; }
    const hd = DL.hopDongHieuLuc(p.id);
    if (!hd) { thongBao('Phòng chưa có hợp đồng hiệu lực.', 'loi'); return; }
    const soDien = Number(oDien.value);
    const soNuoc = Number(oNuoc.value);
    if (isNaN(soDien) || isNaN(soNuoc) || soDien < 0 || soNuoc < 0) {
      thongBao('Sản lượng điện và nước không được âm.', 'loi'); return;
    }
    const han = giaTri('fhHanHd');
    if (!han) { thongBao('Vui lòng chọn hạn thanh toán.', 'loi'); return; }

    const tinh = DL.tinhTong({
      tienThue: hd.tienThue, giaDien: hd.giaDien, giaNuoc: hd.giaNuoc,
      phiDichVu: hd.phiDichVu, soDien: soDien, soNuoc: soNuoc
    });
    const g = DL.goiYChiSo(p.id, ky);
    const hoaDon = DL.them('hoadon', {
      ma: sinhMaHoaDon(p, ky), ky: ky, phongId: p.id, khachId: hd.khachId,
      tienPhong: hd.tienThue, soDien: soDien, giaDien: hd.giaDien, tienDien: tinh.tienDien,
      soNuoc: soNuoc, giaNuoc: hd.giaNuoc, tienNuoc: tinh.tienNuoc,
      phiDichVu: hd.phiDichVu, tong: tinh.tong, han: han,
      daGui: false, trangThai: 'hieuluc', ngayTao: homNay()
    });
    DL.luuChiSo(p.id, ky, {
      dienDau: g.dienDau, dienCuoi: g.dienDau + soDien,
      nuocDau: g.nuocDau, nuocCuoi: g.nuocDau + soNuoc,
      ngayChot: homNay()
    });

    dongHop();
    thongBao('Đã tạo hóa đơn ' + hoaDon.ma + ' · ' + tien(hoaDon.tong) + '.');
    if (xong) xong();
  };
}

/* Xem chi tiết hóa đơn */
function moChiTietHoaDon(hd, quyen, xong) {
  if (!hd) return;
  const p = DL.tim('phong', hd.phongId);
  const k = DL.tim('khach', hd.khachId);
  const tt = DL.trangThaiHoaDon(hd);
  const dsThanhToan = DL.lay('thanhtoan').filter(function (t) { return t.hoaDonId === hd.id; });

  const lop = moHop({
    rong: true,
    tieuDe: 'Hóa đơn ' + thoat(hd.ma),
    moTa: 'Kỳ ' + kyDep(hd.ky) + ' · ' + (p ? thoat(p.ma) + ' · ' + thoat(p.ten) : '') + ' · ' + (k ? thoat(k.hoTen) : ''),
    noiDung:
      '<div class="hang" style="justify-content:space-between;margin-bottom:14px">' +
        nhanHoaDon(hd) +
        '<span class="phu">Hạn thanh toán: ' + ngay(hd.han) + ' · Tạo ngày ' + ngay(hd.ngayTao) + '</span>' +
      '</div>' +
      '<div class="khoi-tien" style="margin-top:0">' +
        '<div class="dong-tien"><span>Tiền phòng</span><b>' + tien(hd.tienPhong) + '</b></div>' +
        '<div class="dong-tien"><span>Điện · ' + thoat(hd.soDien) + ' kWh × ' + tien(hd.giaDien) + '</span><b>' + tien(hd.tienDien) + '</b></div>' +
        '<div class="dong-tien"><span>Nước · ' + thoat(hd.soNuoc) + ' m³ × ' + tien(hd.giaNuoc) + '</span><b>' + tien(hd.tienNuoc) + '</b></div>' +
        '<div class="dong-tien"><span>Phí dịch vụ</span><b>' + tien(hd.phiDichVu) + '</b></div>' +
        '<div class="dong-tien dong-tien--tong"><span>Tổng cộng</span><b>' + tien(hd.tong) + '</b></div>' +
        '<div class="dong-tien"><span>Đã thu</span><b>' + tien(tt.daThu) + '</b></div>' +
        '<div class="dong-tien dong-tien--no"><span>Còn lại</span><b>' + (hd.trangThai === 'huy' ? '—' : tien(tt.con)) + '</b></div>' +
      '</div>' +
      '<div class="vach"></div>' +
      '<h3 style="font-size:14px;font-family:var(--font-chu);margin-bottom:10px">Lịch sử thanh toán</h3>' +
      (dsThanhToan.length
        ? '<div class="ds-thanh-toan">' + dsThanhToan.map(function (t) {
            return '<div class="dong-thanh-toan"><span>' + ngay(t.ngay) + ' · ' + thoat(t.phuongThuc) +
              (t.ghiChu ? ' · ' + thoat(t.ghiChu) : '') + '</span><b>' + tien(t.soTien) + '</b></div>';
          }).join('') + '</div>'
        : '<p class="chu-mo" style="font-size:13px">Chưa có khoản thanh toán nào.</p>') +
      (hd.trangThai === 'huy' ? '<p class="loi" style="margin-top:14px">Hóa đơn đã hủy, không tính vào doanh thu và công nợ.</p>' : ''),
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Đóng</button>' +
      (hd.trangThai !== 'huy' && tt.con > 0 ? '<button class="nut nut--chinh" id="chiThu">Ghi nhận thanh toán</button>' : '') +
      (hd.trangThai !== 'huy' && quyen.huyHoaDon && tt.daThu === 0 ? '<button class="nut nut--ngoc" id="chiHuy">Hủy hóa đơn</button>' : '') +
      (hd.trangThai !== 'huy' && quyen.xoaHoaDon && tt.daThu === 0 ? '<button class="nut nut--xoa" id="chiXoa">Xóa hẳn</button>' : '')
  });

  const nutThu = document.getElementById('chiThu');
  if (nutThu) {
    nutThu.onclick = function () {
      moThanhToan(hd, function () { if (xong) xong(); });
    };
  }
  const nutHuy = document.getElementById('chiHuy');
  if (nutHuy) {
    nutHuy.onclick = function () { huyHoaDon(hd, xong); };
  }
  const nutXoa = document.getElementById('chiXoa');
  if (nutXoa) {
    nutXoa.onclick = function () { xoaHoaDon(hd, xong); };
  }
}

/* Ghi nhận thanh toán (thu một phần hoặc thu đủ) */
function moThanhToan(hd, xong) {
  if (!hd) return;
  const tt = DL.trangThaiHoaDon(hd);
  if (tt.con <= 0) { thongBao('Hóa đơn này đã thanh toán đủ.', 'loi'); return; }

  moHop({
    tieuDe: 'Ghi nhận thanh toán',
    moTa: 'Hóa đơn ' + thoat(hd.ma) + ' · còn nợ <b>' + tien(tt.con) + '</b>.',
    noiDung:
      '<form class="bieu-mau" id="formThanhToan">' +
        '<div class="nhom"><label for="ttTien">Số tiền thu *</label>' +
          '<input id="ttTien" type="number" min="1" step="1000" max="' + tt.con + '" class="o-nhap" value="' + tt.con + '"></div>' +
        '<div class="nhom"><label for="ttPhuongThuc">Phương thức</label><select id="ttPhuongThuc" class="o-chon">' +
          '<option>Tiền mặt</option><option>Chuyển khoản</option><option>Khác</option></select></div>' +
        '<div class="nhom"><label for="ttGhiChu">Ghi chú</label><input id="ttGhiChu" class="o-nhap" placeholder="Không bắt buộc"></div>' +
        '<p class="goi-y">Không thu vượt số còn nợ. Mỗi lần thu là một khoản ghi riêng, không sửa số đã thu.</p>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuThanhToan">Ghi nhận</button>'
  });

  const oTien = document.getElementById('ttTien');
  const oPhuongThuc = document.getElementById('ttPhuongThuc');
  const oGhiChu = document.getElementById('ttGhiChu');

  document.getElementById('luuThanhToan').onclick = function () {
    const soTien = Number(oTien.value);
    if (!soTien || soTien <= 0) { thongBao('Số tiền thu phải lớn hơn 0.', 'loi'); return; }
    if (soTien > tt.con) { thongBao('Số tiền thu vượt quá số còn nợ (' + tien(tt.con) + ').', 'loi'); return; }
    DL.them('thanhtoan', {
      hoaDonId: hd.id, soTien: soTien,
      phuongThuc: oPhuongThuc.value, ghiChu: oGhiChu.value.trim(), ngay: homNay()
    });
    const moi = DL.trangThaiHoaDon(hd);
    dongHop();
    thongBao('Đã ghi nhận ' + tien(soTien) + ' · ' + moi.chu + '.');
    if (xong) xong();
  };
}

/* Hủy hóa đơn (giữ lịch sử) */
async function huyHoaDon(hd, xong) {
  const tt = DL.trangThaiHoaDon(hd);
  if (tt.daThu > 0) {
    await hoi('Không thể hủy', 'Hóa đơn đã có khoản thanh toán. Hãy giữ hóa đơn để đối chiếu.', 'Đã hiểu');
    return;
  }
  const dongY = await hoi('Hủy hóa đơn?', 'Hóa đơn <b>' + thoat(hd.ma) + '</b> sẽ chuyển sang “Đã hủy”, giữ lịch sử và không tính vào doanh thu, công nợ.', 'Hủy hóa đơn');
  if (!dongY) return;
  DL.sua('hoadon', hd.id, { trangThai: 'huy' });
  thongBao('Đã hủy hóa đơn.');
  dongHop();
  if (xong) xong();
}

/* Xóa hẳn hóa đơn chưa có thanh toán */
async function xoaHoaDon(hd, xong) {
  if (DL.daThu(hd.id) > 0) {
    await hoi('Không thể xóa', 'Hóa đơn đã có khoản thanh toán nên chỉ có thể giữ lại để đối chiếu.', 'Đã hiểu');
    return;
  }
  const dongY = await hoi('Xóa hẳn hóa đơn?', 'Hóa đơn <b>' + thoat(hd.ma) + '</b> sẽ bị xóa khỏi hệ thống. Chỉ nên làm khi hóa đơn lập sai và chưa thu tiền.', 'Xóa hóa đơn');
  if (!dongY) return;
  DL.xoa('hoadon', hd.id);
  thongBao('Đã xóa hóa đơn.');
  dongHop();
  if (xong) xong();
}

/* ============================================================
   MÀN HÌNH SỰ CỐ
   ============================================================ */

function manSuCo(quyen) {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Sự cố', 'Tiếp nhận, phân công và theo dõi tiến độ xử lý sự cố của khách thuê.',
        quyen.taoSuCo ? '<button class="nut nut--chinh" id="themSuCo">Tạo hộ khách</button>' : '') +
      '<div class="toolbar">' +
        '<div class="toolbar__trai">' +
          oTim('timSuCo', 'Tìm mã, phòng, khách, tiêu đề…', TT.suco.tim) +
          '<div class="nhom-chip" id="chipSuCo">' +
            chipLoc('tatca', 'Tất cả', TT.suco.loc === 'tatca') +
            chipLoc('moi', 'Mới', TT.suco.loc === 'moi') +
            chipLoc('dangxuly', 'Đang xử lý', TT.suco.loc === 'dangxuly') +
            chipLoc('hoanthanh', 'Đã hoàn thành', TT.suco.loc === 'hoanthanh') +
          '</div>' +
          '<select id="mucDoSuCo" class="o-loc">' +
            '<option value="tatca">Mọi mức độ</option>' +
            '<option value="Cao"' + (TT.suco.mucDo === 'Cao' ? ' selected' : '') + '>Cao</option>' +
            '<option value="Trung bình"' + (TT.suco.mucDo === 'Trung bình' ? ' selected' : '') + '>Trung bình</option>' +
            '<option value="Thấp"' + (TT.suco.mucDo === 'Thấp' ? ' selected' : '') + '>Thấp</option>' +
          '</select>' +
        '</div>' +
        '<span class="dem" id="demSuCo"></span>' +
      '</div>' +
      '<div id="khuSuCo"></div>' +
    '</div>';

  veSuCo(quyen);

  const nutThem = document.getElementById('themSuCo');
  if (nutThem) {
    nutThem.onclick = function () { moFormSuCo(function () { veSuCo(quyen); }); };
  }
  ganTim('timSuCo', function (v) { TT.suco.tim = v; veSuCo(quyen); });
  document.getElementById('mucDoSuCo').onchange = function (e) {
    TT.suco.mucDo = e.target.value;
    veSuCo(quyen);
  };
  ganChip('chipSuCo', function (loc) {
    TT.suco.loc = loc;
    document.querySelectorAll('#chipSuCo .chip').forEach(function (b) {
      b.classList.toggle('dang-chon', b.dataset.loc === loc);
    });
    veSuCo(quyen);
  });
}

function veSuCo(quyen) {
  const khu = document.getElementById('khuSuCo');
  if (!khu) return;
  const tatCa = DL.lay('suco');
  const tim = TT.suco.tim.toLowerCase();
  const thang = thangNay();

  const ds = tatCa.filter(function (sc) {
    if (TT.suco.loc !== 'tatca' && sc.trangThai !== TT.suco.loc) return false;
    if (TT.suco.mucDo !== 'tatca' && sc.mucDo !== TT.suco.mucDo) return false;
    if (!tim) return true;
    const p = DL.tim('phong', sc.phongId);
    const k = DL.tim('khach', sc.khachId);
    return [sc.ma, sc.tieuDe, sc.phanLoai, p ? p.ma : '', k ? k.hoTen : ''].join(' ').toLowerCase().indexOf(tim) >= 0;
  }).sort(function (a, b) {
    return a.ngayGui < b.ngayGui ? 1 : -1;
  });

  const trongThang = tatCa.filter(function (sc) { return thangCua(sc.ngayGui) === thang; });
  const dem = { moi: 0, dangxuly: 0, hoanthanh: 0 };
  trongThang.forEach(function (sc) { dem[sc.trangThai] = (dem[sc.trangThai] || 0) + 1; });

  const dong = ds.map(function (sc) {
    const p = DL.tim('phong', sc.phongId);
    const k = DL.tim('khach', sc.khachId);
    return [
      '<strong>' + thoat(sc.ma) + '</strong>',
      '<div>' + thoat(sc.tieuDe) + '</div><div class="phu">' + thoat(sc.phanLoai) + '</div>',
      p ? thoat(p.ma) + (k ? '<div class="phu">' + thoat(k.hoTen) + '</div>' : '') : '<span class="phu">—</span>',
      nhanMucDo(sc.mucDo),
      ngayGio(sc.ngayGui),
      nhanSuco(sc),
      '<button class="nut nut--ngoc nut--nho" data-xem="' + sc.id + '">Xem phiếu</button>'
    ];
  });

  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Mới trong tháng', so: dem.moi, lop: 'thong-ke__so--do' },
      { nhan: 'Đang xử lý', so: tatCa.filter(function (sc) { return sc.trangThai === 'dangxuly'; }).length, lop: 'thong-ke__so--xanh' },
      { nhan: 'Hoàn thành tháng này', so: dem.hoanthanh, lop: 'thong-ke__so--la' },
      { nhan: 'Tổng phiếu', so: tatCa.length }
    ]) +
    bangHtml(['Mã', 'Sự cố', 'Phòng / khách', 'Mức độ', 'Ngày gửi', 'Trạng thái', ''], dong);

  const oDem = document.getElementById('demSuCo');
  if (oDem) oDem.textContent = ds.length + ' phiếu';

  khu.onclick = function (e) {
    const xem = e.target.closest('[data-xem]');
    if (xem) moChiTietSuCo(DL.tim('suco', xem.dataset.xem), quyen, function () { veSuCo(quyen); });
  };
}

/* Chi tiết và cập nhật tiến độ sự cố */
function moChiTietSuCo(sc, quyen, xong) {
  if (!sc) return;
  const p = DL.tim('phong', sc.phongId);
  const k = DL.tim('khach', sc.khachId);
  const daXong = sc.trangThai === 'hoanthanh';

  const lop = moHop({
    tieuDe: 'Phiếu sự cố ' + thoat(sc.ma),
    moTa: (p ? thoat(p.ma) + ' · ' + thoat(p.ten) : '') + ' · ' + ngayGio(sc.ngayGui),
    noiDung:
      '<div class="hang" style="gap:8px;margin-bottom:14px">' + nhanSuco(sc) + nhanMucDo(sc.mucDo) +
        '<span class="phu">' + thoat(sc.phanLoai) + '</span></div>' +
      '<h3 style="font-size:21px;letter-spacing:-0.2px;line-height:1.3">' + thoat(sc.tieuDe) + '</h3>' +
      '<p class="chu-mo" style="font-size:14px;margin-top:10px;line-height:1.6">' + thoat(sc.moTa) + '</p>' +
      '<div class="vach"></div>' +
      danhSachMoTa([
        ['Người báo', thoat(sc.nguoiBao || (k ? k.hoTen : '—'))],
        ['Số điện thoại', thoat(sc.sdt || (k ? k.sdt : '—'))],
        ['Phòng', p ? thoat(p.ma) + ' — ' + thoat(p.ten) : '—'],
        ['Phân loại', thoat(sc.phanLoai)],
        ['Mức độ', thoat(sc.mucDo)],
      ]) +
      (daXong ? '' :
        '<div class="vach"></div>' +
        '<div class="luoi-nhap">' +
          '<div class="nhom"><label for="scXuLy">Thợ / đơn vị sửa</label><input id="scXuLy" class="o-nhap" value="' + thoat(sc.nguoiXuLy || '') + '" placeholder="VD: Phan Văn Tú"></div>' +
          '<div class="nhom"><label for="scChiPhi">Chi phí phát sinh</label><input id="scChiPhi" type="number" min="0" step="1000" class="o-nhap" value="' + (sc.chiPhi || 0) + '"></div>' +
        '</div>') +
      (daXong ? '<p class="loi loi--thanh-cong" style="margin-top:16px">Sự cố đã hoàn thành' +
        (sc.nguoiXuLy ? ' · ' + thoat(sc.nguoiXuLy) : '') +
        (sc.chiPhi ? ' · chi phí ' + tien(sc.chiPhi) : '') + '.</p>' : ''),
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Đóng</button>' +
      (daXong ? '' :
        '<button class="nut nut--ngoc" id="scLuu">Lưu tiến độ</button>' +
        (sc.trangThai === 'moi' ? '<button class="nut nut--chinh" id="scTiepNhan">Tiếp nhận</button>' : '') +
        (sc.trangThai === 'dangxuly' ? '<button class="nut nut--chinh" id="scHoanThanh">Đánh dấu hoàn thành</button>' : ''))
  });

  function luuThongTin() {
    return {
      nguoiXuLy: giaTri('scXuLy'),
      chiPhi: soGiaTri('scChiPhi')
    };
  }

  const nutLuu = document.getElementById('scLuu');
  if (nutLuu) {
    nutLuu.onclick = function () {
      const du = luuThongTin();
      if (du.chiPhi < 0) { thongBao('Chi phí không được âm.', 'loi'); return; }
      DL.sua('suco', sc.id, du);
      dongHop();
      thongBao('Đã lưu tiến độ xử lý.');
      if (xong) xong();
    };
  }

  const nutTiepNhan = document.getElementById('scTiepNhan');
  if (nutTiepNhan) {
    nutTiepNhan.onclick = function () {
      const du = luuThongTin();
      du.trangThai = 'dangxuly';
      DL.sua('suco', sc.id, du);
      dongHop();
      thongBao('Đã tiếp nhận sự cố, chuyển sang “Đang xử lý”.');
      if (xong) xong();
    };
  }

  const nutXong = document.getElementById('scHoanThanh');
  if (nutXong) {
    nutXong.onclick = async function () {
      const du = luuThongTin();
      const dongY = await hoi('Hoàn thành sự cố?', 'Phiếu <b>' + thoat(sc.ma) + '</b> sẽ chuyển sang “Đã hoàn thành”.', 'Hoàn thành');
      if (!dongY) return;
      du.trangThai = 'hoanthanh';
      DL.sua('suco', sc.id, du);
      dongHop();
      thongBao('Đã đánh dấu sự cố hoàn thành.');
      if (xong) xong();
    };
  }
}

/* Tạo sự cố hộ khách (quản lý) */
function moFormSuCo(xong) {
  const phongDS = DL.lay('phong').filter(function (p) { return DL.hopDongHieuLuc(p.id); })
    .sort(function (a, b) { return a.ma.localeCompare(b.ma); });
  if (!phongDS.length) { thongBao('Chưa có phòng đang thuê để tạo sự cố.', 'loi'); return; }

  moHop({
    tieuDe: 'Tạo sự cố hộ khách',
    moTa: 'Dùng khi khách báo qua điện thoại hoặc Zalo. Khách được lấy theo hợp đồng hiệu lực của phòng.',
    noiDung:
      '<form class="bieu-mau" id="formSuCo">' +
        '<div class="luoi-nhap">' +
          '<div class="nhom"><label for="scPhong">Phòng *</label><select id="scPhong" class="o-chon">' +
            phongDS.map(function (p) { return '<option value="' + p.id + '">' + thoat(p.ma) + ' — ' + thoat(p.ten) + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="nhom"><label for="scPhanLoai">Phân loại</label><select id="scPhanLoai" class="o-chon">' +
            '<option>Điện</option><option>Nước</option><option>Cơ sở vật chất</option><option>Vệ sinh</option><option>An ninh</option><option>Khác</option>' +
          '</select></div>' +
          '<div class="nhom rong"><label for="scTieuDe">Tiêu đề *</label><input id="scTieuDe" class="o-nhap" maxlength="120" placeholder="Tối đa 120 ký tự"></div>' +
          '<div class="nhom"><label for="scMucDo">Mức độ</label><select id="scMucDo" class="o-chon">' +
            '<option>Thấp</option><option selected>Trung bình</option><option>Cao</option></select></div>' +
          '<div class="nhom"><label for="scNguoiBao">Người báo</label><input id="scNguoiBao" class="o-nhap" readonly></div>' +
          '<div class="nhom rong"><label for="scMoTa">Mô tả</label><textarea id="scMoTa" class="o-vung" maxlength="1000" placeholder="Tối đa 1.000 ký tự"></textarea></div>' +
        '</div>' +
      '</form>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
      '<button class="nut nut--chinh" id="luuSuCo">Tạo phiếu</button>'
  });

  function capNhatNguoiBao() {
    const hd = DL.hopDongHieuLuc(giaTri('scPhong'));
    const k = hd ? DL.tim('khach', hd.khachId) : null;
    document.getElementById('scNguoiBao').value = k ? k.hoTen + ' · ' + k.sdt : '';
  }
  document.getElementById('scPhong').onchange = capNhatNguoiBao;
  capNhatNguoiBao();

  document.getElementById('luuSuCo').onclick = function () {
    const phongId = giaTri('scPhong');
    const tieuDe = giaTri('scTieuDe');
    if (!phongId || !tieuDe) { thongBao('Vui lòng chọn phòng và nhập tiêu đề.', 'loi'); return; }
    if (tieuDe.length > 120) { thongBao('Tiêu đề tối đa 120 ký tự.', 'loi'); return; }
    const hd = DL.hopDongHieuLuc(phongId);
    const k = hd ? DL.tim('khach', hd.khachId) : null;
    const soTiepTheo = String(DL.soBanGhiToanBo('suco') + 1).padStart(4, '0');
    DL.them('suco', {
      ma: 'SC-' + soTiepTheo, phongId: phongId, khachId: k ? k.id : '',
      tieuDe: tieuDe, phanLoai: giaTri('scPhanLoai'), mucDo: giaTri('scMucDo'),
      moTa: giaTri('scMoTa'), ngayGui: new Date().toISOString().slice(0, 16),
      trangThai: 'moi', nguoiXuLy: '', chiPhi: 0,
      nguoiBao: k ? k.hoTen : 'Quản lý ghi hộ', sdt: k ? k.sdt : ''
    });
    dongHop();
    thongBao('Đã tạo phiếu sự cố.');
    if (xong) xong();
  };
}

/* ============================================================
   MÀN HÌNH THÔNG BÁO
   ============================================================ */

function manThongBao(quyen) {
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Thông báo', 'Thông báo hiển thị cho toàn bộ khách thuê của nhà trọ.',
        '<button class="nut nut--chinh" id="themThongBao">Đăng thông báo</button>') +
      '<div class="toolbar">' +
        '<div class="toolbar__trai">' + oTim('timThongBao', 'Tìm tiêu đề, nội dung…', '') + '</div>' +
      '</div>' +
      '<div id="khuThongBao"></div>' +
    '</div>';

  function ve(tim) {
    const ds = DL.lay('thongbao').filter(function (tb) {
      if (!tim) return true;
      return (tb.tieuDe + ' ' + tb.noiDung).toLowerCase().indexOf(tim) >= 0;
    }).sort(function (a, b) { return a.ngayDang < b.ngayDang ? 1 : -1; });

    const khuDs = document.getElementById('khuThongBao');
    khuDs.innerHTML = ds.length
      ? ds.map(function (tb) {
          return '<div class="the" style="margin-bottom:14px">' +
            '<div class="the__dau"><div><h3>' + thoat(tb.tieuDe) + '</h3>' +
            '<p>Đăng ngày ' + ngay(tb.ngayDang) + '</p></div>' +
            '<div class="nhom-nut"><button class="nut nut--xoa" data-xoa="' + tb.id + '">Xóa</button></div></div>' +
            '<p style="font-size:15px;color:var(--muc-80);white-space:pre-line">' + thoat(tb.noiDung) + '</p>' +
          '</div>';
        }).join('')
      : trangTrong('Chưa có thông báo', 'Đăng thông báo đầu tiên để khách thuê nhìn thấy trong trang của họ.');

    khuDs.onclick = function (e) {
      const b = e.target.closest('[data-xoa]');
      if (!b) return;
      const tb = DL.tim('thongbao', b.dataset.xoa);
      hoi('Xóa thông báo?', 'Thông báo <b>' + thoat(tb.tieuDe) + '</b> sẽ bị xóa khỏi trang khách thuê.', 'Xóa thông báo').then(function (dongY) {
        if (!dongY) return;
        DL.xoa('thongbao', tb.id);
        thongBao('Đã xóa thông báo.');
        ve(document.getElementById('timThongBao').value.trim().toLowerCase());
      });
    };
  }

  ve('');
  ganTim('timThongBao', function (v) { ve(v.toLowerCase()); });
  document.getElementById('themThongBao').onclick = function () {
    moHop({
      tieuDe: 'Đăng thông báo',
      moTa: 'Ngày đăng được ghi tự động là hôm nay.',
      noiDung:
        '<form class="bieu-mau" id="formThongBao">' +
          '<div class="nhom"><label for="tbTieuDe">Tiêu đề *</label><input id="tbTieuDe" class="o-nhap" maxlength="120"></div>' +
          '<div class="nhom"><label for="tbNoiDung">Nội dung *</label><textarea id="tbNoiDung" class="o-vung" rows="6" style="min-height:140px"></textarea></div>' +
        '</form>',
      chanTrang:
        '<button class="nut nut--ngoc" data-dong>Hủy</button>' +
        '<button class="nut nut--chinh" id="luuThongBao">Đăng thông báo</button>'
    });
    document.getElementById('luuThongBao').onclick = function () {
      const tieuDe = giaTri('tbTieuDe');
      const noiDung = giaTri('tbNoiDung');
      if (!tieuDe || !noiDung) { thongBao('Vui lòng nhập tiêu đề và nội dung.', 'loi'); return; }
      DL.them('thongbao', { tieuDe: tieuDe, noiDung: noiDung, ngayDang: homNay() });
      dongHop();
      thongBao('Đã đăng thông báo.');
      ve('');
    };
  };
}

/* ============================================================
   MÀN HÌNH TÀI KHOẢN CỦA NGƯỜI DÙNG
   ============================================================ */

function manTaiKhoan(quyen) {
  const nd = DL.phien();
  if (!nd) return;
  let hoSo = null;
  let moTaHoSo = [];
  if (nd.loaiHoSo === 'nhanvien') {
    hoSo = DL.tim('nhanvien', nd.hoSoId);
    if (hoSo) moTaHoSo = [['Chức vụ', thoat(hoSo.chucVu)], ['Khu vực phụ trách', thoat(hoSo.khuVuc)], ['Điện thoại', thoat(hoSo.sdt)]];
  }

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Tài khoản', 'Thông tin đăng nhập và mật khẩu của bạn.') +
      '<div class="luoi luoi--1-2" style="margin-top:24px">' +
        '<div class="the">' +
          '<div class="the__dau"><h3>Hồ sơ</h3></div>' +
          danhSachMoTa([['Họ tên', thoat(nd.hoTen)], ['Vai trò', TEN_VAI_TRO[nd.vaiTro] || nd.vaiTro],
            ['Tên đăng nhập', '<span class="ma-don">' + thoat(nd.tenDangNhap) + '</span>']].concat(moTaHoSo)) +
          '<div class="vach"></div>' +
          '<button class="nut nut--ngoc" id="nutDangXuatTk">Đăng xuất</button>' +
          (quyen.khoiPhucDuLieu && !DL.cheDoSupabase
            ? '<div class="vach"></div><p class="ghi-chu-nho">Dữ liệu demo được lưu trên trình duyệt. Có thể khôi phục về bộ dữ liệu mẫu ban đầu.</p>' +
              '<button class="nut nut--xoa" id="nutKhoiPhuc" style="margin-top:8px">Khôi phục dữ liệu mẫu</button>'
            : '') +
          (quyen.khoiPhucDuLieu && DL.cheDoSupabase
            ? '<div class="vach"></div><p class="ghi-chu-nho">Để thử ứng dụng, nạp bộ dữ liệu mẫu (cơ sở, phòng, khách, hợp đồng, hóa đơn và thanh toán). Chỉ nạp khi Supabase chưa có dữ liệu.</p>' +
              '<button class="nut nut--chinh" id="nutNapDuLieuMau" style="margin-top:8px">Nạp dữ liệu mẫu</button>' +
              '<p class="ghi-chu-nho" style="margin-top:12px">Hoặc nhập dữ liệu cũ đã lưu trên trình duyệt.</p>' +
              '<button class="nut nut--ngoc" id="nutNhapDuLieuCu" style="margin-top:8px">Nhập dữ liệu cũ</button>'
            : '') +
        '</div>' +
        '<div class="the">' +
          '<div class="the__dau"><div><h3>Đổi mật khẩu</h3><p>Mật khẩu mới tối thiểu 8 ký tự.</p></div></div>' +
          '<form class="bieu-mau" id="formDoiMatKhau">' +
            '<div class="nhom"><label for="mkHienTai">Mật khẩu hiện tại</label><input id="mkHienTai" type="password" class="o-nhap" autocomplete="current-password"></div>' +
            '<div class="nhom"><label for="mkMoiTk">Mật khẩu mới</label><input id="mkMoiTk" type="password" class="o-nhap" autocomplete="new-password"></div>' +
            '<div class="nhom"><label for="mkLaiTk">Nhập lại mật khẩu mới</label><input id="mkLaiTk" type="password" class="o-nhap" autocomplete="new-password"></div>' +
            '<p class="loi" id="loiDoiTk" hidden></p>' +
            '<div><button type="button" class="nut nut--chinh" id="luuDoiTk">Cập nhật mật khẩu</button></div>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('nutDangXuatTk').onclick = function () {
    hoi('Đăng xuất?', 'Bạn sẽ quay về trang giới thiệu.', 'Đăng xuất').then(function (dongY) {
      if (!dongY) return;
      DL.dangXuat().then(function () { location.href = '../index.html'; }).catch(function (loi) {
        console.error('Đăng xuất thất bại:', loi);
        thongBao('Không thể đăng xuất khỏi Supabase. Vui lòng thử lại.', 'loi');
      });
    });
  };

  const nutKhoiPhuc = document.getElementById('nutKhoiPhuc');
  if (nutKhoiPhuc) {
    nutKhoiPhuc.onclick = async function () {
      const dongY = await hoi('Khôi phục dữ liệu mẫu?', 'Toàn bộ dữ liệu hiện tại sẽ được thay bằng bộ dữ liệu mẫu ban đầu. Bạn sẽ được đưa về trang đăng nhập.', 'Khôi phục');
      if (!dongY) return;
      DL.datLai();
      DL.dangXuat();
      location.href = 'dangnhap.html';
    };
  }

  const nutNhapCu = document.getElementById('nutNhapDuLieuCu');
  if (nutNhapCu) {
    nutNhapCu.onclick = async function () {
      const dongY = await hoi('Nhập dữ liệu cũ?', 'Các bản ghi hiện có trong trình duyệt sẽ được thêm vào Supabase. Không nhập chồng dữ liệu đã có.', 'Nhập dữ liệu');
      if (!dongY) return;
      try {
        const soLuong = await DL.nhapDuLieuCu();
        thongBao('Đã nhập ' + soLuong + ' bản ghi vào Supabase.');
        location.reload();
      } catch (loi) {
        console.error('Nhập dữ liệu cũ thất bại:', loi);
        thongBao(loi.message || 'Không thể nhập dữ liệu cũ.', 'loi');
      }
    };
  }

  const nutNapMau = document.getElementById('nutNapDuLieuMau');
  if (nutNapMau) {
    nutNapMau.onclick = async function () {
      const dongY = await hoi(
        'Nạp dữ liệu mẫu?',
        'Tạo dữ liệu demo cho hai cơ sở với phòng, khách thuê, hợp đồng, hóa đơn, thanh toán và chi phí. Không tạo tài khoản đăng nhập demo. Chỉ nạp được khi Supabase chưa có dữ liệu.',
        'Nạp dữ liệu mẫu'
      );
      if (!dongY) return;
      nutNapMau.disabled = true;
      try {
        const soLuong = await DL.napDuLieuMau();
        thongBao('Đã nạp ' + soLuong + ' bản ghi mẫu vào Supabase.');
        location.reload();
      } catch (loi) {
        console.error('Nạp dữ liệu mẫu thất bại:', loi);
        thongBao(loi.message || 'Không thể nạp dữ liệu mẫu.', 'loi');
        nutNapMau.disabled = false;
      }
    };
  }

  document.getElementById('luuDoiTk').onclick = async function () {
    const hienTai = giaTri('mkHienTai');
    const moi = giaTri('mkMoiTk');
    const lai = giaTri('mkLaiTk');
    const loi = document.getElementById('loiDoiTk');
    function baoLoi(chu) { loi.hidden = false; loi.textContent = chu; }
    loi.hidden = true;
    if (moi.length < 8) return baoLoi('Mật khẩu mới phải có ít nhất 8 ký tự.');
    if (moi !== lai) return baoLoi('Hai lần nhập mật khẩu mới không khớp.');
    try {
      if (!await DL.xacThucMatKhau(nd.id, hienTai)) return baoLoi('Mật khẩu hiện tại không đúng.');
      await DL.doiMatKhau(nd.id, moi);
      thongBao('Đã đổi mật khẩu thành công.');
      document.getElementById('formDoiMatKhau').reset();
    } catch (loi) {
      console.error('Đổi mật khẩu thất bại:', loi);
      baoLoi('Không thể đổi mật khẩu. Vui lòng thử lại.');
    }
  };
}

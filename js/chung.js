/* ============================================================
   chung.js — Tiện ích dùng chung: định dạng, hộp thoại, thông báo,
   khung trang (thanh trên + menu trái), kiểm tra đăng nhập.
   ============================================================ */

/* ---------- Định dạng ---------- */

/* Chống chèn HTML lạ */
function thoat(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Định dạng tiền Việt Nam */
function tien(n) {
  return (Number(n) || 0).toLocaleString('vi-VN') + ' ₫';
}

/* Ngày YYYY-MM-DD -> 10/11/2026 */
function ngay(iso) {
  if (!iso) return '—';
  const phan = String(iso).slice(0, 10).split('-');
  if (phan.length !== 3) return thoat(iso);
  return phan[2] + '/' + phan[1] + '/' + phan[0];
}

/* Ngày giờ ISO -> 10/11/2026 · 09:20 */
function ngayGio(iso) {
  if (!iso) return '—';
  const s = String(iso);
  const d = s.slice(0, 10);
  const gio = s.length > 11 ? s.slice(11, 16) : '';
  return ngay(d) + (gio ? ' · ' + gio : '');
}

/* Kỳ YYYY-MM -> 11/2026 */
function kyDep(ky) {
  if (!ky) return '—';
  const p = String(ky).split('-');
  return p.length === 2 ? p[1] + '/' + p[0] : thoat(ky);
}

/* Hôm nay dạng YYYY-MM-DD */
function homNay() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Tháng hiện tại dạng YYYY-MM */
function thangNay() {
  return homNay().slice(0, 7);
}

/* Cộng thêm số ngày vào một ngày ISO */
function themNgay(iso, soNgay) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + Number(soNgay || 0));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Số ngày còn lại tới một ngày (âm nếu đã qua) */
function soNgayCon(iso) {
  if (!iso) return 0;
  const dich = new Date(iso + 'T00:00:00').getTime();
  const nay = new Date(homNay() + 'T00:00:00').getTime();
  return Math.round((dich - nay) / 86400000);
}

/* Lấy tháng của một ngày ISO */
function thangCua(iso) {
  return iso ? String(iso).slice(0, 7) : '';
}

/* ---------- Nhãn trạng thái ---------- */

function nhan(chu, loai) {
  return '<span class="nhan ' + (loai ? 'nhan--' + loai : '') + '">' + thoat(chu) + '</span>';
}

function nhanPhong(p) {
  if (p.trangThai === 'baotri') return nhan('Bảo trì', 'cam');
  if (p.trangThai === 'dangthue') return nhan('Đang thuê', 'xanh');
  return nhan('Còn trống', 'xanh-la');
}

function nhanHoaDon(hd) {
  const tt = DL.trangThaiHoaDon(hd);
  const lop = { 'moi': 'cam', 'mot-phan': 'xanh', 'xong': 'xanh-la', 'qua-han': 'do', 'huy': '' }[tt.loai] || '';
  return nhan(tt.chu, lop);
}

function nhanSuco(sc) {
  if (sc.trangThai === 'hoanthanh') return nhan('Đã hoàn thành', 'xanh-la');
  if (sc.trangThai === 'dangxuly') return nhan('Đang xử lý', 'xanh');
  return nhan('Mới', 'cam');
}

function nhanMucDo(mucDo) {
  if (mucDo === 'Cao') return nhan('Cao', 'do');
  if (mucDo === 'Trung bình') return nhan('Trung bình', 'cam');
  return nhan('Thấp', '');
}

function nhanTaiKhoan(u) {
  if (!u) return nhan('Chưa cấp', '');
  if (u.trangThai === 'khoa') return nhan('Đã khóa', 'do');
  if (u.phaiDoiMatKhau) return nhan('Mật khẩu tạm', 'cam');
  return nhan('Đang hoạt động', 'xanh-la');
}

/* ---------- Đọc giá trị ô nhập ---------- */

function giaTri(id) {
  const el = document.getElementById(id);
  return el ? String(el.value).trim() : '';
}

function soGiaTri(id) {
  const n = Number(giaTri(id));
  return isNaN(n) ? 0 : n;
}

/* ---------- Hộp thoại ---------- */

let hopDangMo = null;

function dongHop() {
  if (!hopDangMo) return;
  const khiDong = hopDangMo._khiDong;
  hopDangMo.remove();
  hopDangMo = null;
  if (typeof khiDong === 'function') khiDong();
}

/* Mở hộp thoại. opts: {tieuDe, moTa, noiDung, chanTrang, rong, khoa} */
function moHop(opts) {
  dongHop();
  const lop = document.createElement('div');
  lop.className = 'lop-phu';
  lop.innerHTML =
    '<div class="hop ' + (opts.rong ? 'hop--rong' : '') + (opts.hep ? ' hop--hep' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="hop__dau">' +
        '<div><h2 class="hop__tieu-de">' + (opts.tieuDe || '') + '</h2>' +
        (opts.moTa ? '<p class="hop__mo-ta">' + opts.moTa + '</p>' : '') + '</div>' +
        (opts.khoa ? '' : '<button class="nut-dong" data-dong aria-label="Đóng">✕</button>') +
      '</div>' +
      '<div class="hop__than">' + (opts.noiDung || '') + '</div>' +
      (opts.chanTrang ? '<div class="hop__chan">' + opts.chanTrang + '</div>' : '') +
    '</div>';
  document.body.appendChild(lop);
  lop.addEventListener('click', function (e) {
    if (opts.khoa) return;
    if (e.target === lop || e.target.closest('[data-dong]')) dongHop();
  });
  hopDangMo = lop;
  return lop;
}

/* Hộp thoại xác nhận, trả về Promise<boolean> */
function hoi(tieuDe, noiDung, nhanDongY, nguyHiem) {
  return new Promise(function (giaiQuyet) {
    const lop = moHop({
      tieuDe: tieuDe,
      noiDung: '<p class="chu-mo">' + noiDung + '</p>',
      chanTrang:
        '<button class="nut nut--ngoc" data-khong>Hủy</button>' +
        '<button class="nut ' + (nguyHiem ? 'nut--chinh' : 'nut--chinh') + '" data-co>' + (nhanDongY || 'Xác nhận') + '</button>'
    });
    lop._khiDong = function () { giaiQuyet(false); };
    lop.querySelector('[data-khong]').onclick = function () { dongHop(); };
    lop.querySelector('[data-co]').onclick = function () { giaiQuyet(true); dongHop(); };
  });
}

/* Thông báo nổi ở góc dưới */
function thongBao(noiDung, loai) {
  let khu = document.getElementById('khu-thongbao');
  if (!khu) {
    khu = document.createElement('div');
    khu.id = 'khu-thongbao';
    khu.className = 'khu-thongbao';
    document.body.appendChild(khu);
  }
  const item = document.createElement('div');
  item.className = 'toast toast--' + (loai || 'thanh-cong');
  item.textContent = noiDung;
  khu.appendChild(item);
  setTimeout(function () {
    item.classList.add('toast--an');
    setTimeout(function () { item.remove(); }, 260);
  }, 3200);
}

/* Sao chép chữ vào bộ nhớ tạm */
function saoChep(noiDung) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(noiDung).then(function () {
      thongBao('Đã sao chép.');
    }).catch(function () { saoChepDuPhong(noiDung); });
  } else {
    saoChepDuPhong(noiDung);
  }
}

function saoChepDuPhong(noiDung) {
  const o = document.createElement('textarea');
  o.value = noiDung;
  o.style.position = 'fixed';
  o.style.opacity = '0';
  document.body.appendChild(o);
  o.select();
  try { document.execCommand('copy'); thongBao('Đã sao chép.'); } catch (e) { thongBao('Không sao chép được.', 'loi'); }
  o.remove();
}

/* ---------- Bảng và khối giao diện ---------- */

/* Tạo bảng: cot = mảng tiêu đề, dong = mảng các dòng (mảng ô HTML) */
function bangHtml(cot, dong, soCotTrong) {
  const dau = cot.map(function (c) { return '<th>' + c + '</th>'; }).join('');
  const than = dong.map(function (r) {
    return '<tr>' + r.map(function (o) { return '<td>' + o + '</td>'; }).join('') + '</tr>';
  }).join('');
  return '<div class="the-bang"><table><thead><tr>' + dau + '</tr></thead><tbody>' +
    (than || '<tr><td class="trong" colspan="' + (soCotTrong || cot.length) + '">Chưa có dữ liệu phù hợp.</td></tr>') +
    '</tbody></table></div>';
}

/* Khối thống kê nhỏ: ds = [{nhan, so, ghiChu, lop}], lopThem: lớp bổ sung */
function luoiThongKe(ds, lopThem) {
  return '<div class="luoi-thong-ke' + (lopThem ? ' ' + lopThem : '') + '">' + ds.map(function (m) {
    return '<div class="thong-ke"><p class="thong-ke__nhan">' + m.nhan + '</p>' +
      '<p class="thong-ke__so ' + (m.lop || '') + '">' + m.so + '</p>' +
      (m.ghiChu ? '<p class="thong-ke__ghi-chu">' + m.ghiChu + '</p>' : '') + '</div>';
  }).join('') + '</div>';
}

/* Tiêu đề màn hình */
function dauMan(tieuDe, moTa, nutPhai) {
  return '<div class="man__dau"><div><h1>' + tieuDe + '</h1>' +
    (moTa ? '<p class="mo-ta">' + moTa + '</p>' : '') + '</div>' +
    (nutPhai ? '<div class="man__nut">' + nutPhai + '</div>' : '') + '</div>';
}

/* Ô tìm kiếm */
function oTim(id, goiY, giaTriDau) {
  return '<label class="khung-tim"><span class="khung-tim__icon" aria-hidden="true"></span>' +
    '<input id="' + id + '" type="search" class="o-tim" placeholder="' + goiY + '" value="' + thoat(giaTriDau || '') + '"></label>';
}

/* Gắn sự kiện tìm kiếm có chờ (debounce) */
function ganTim(id, xuLy) {
  const o = document.getElementById(id);
  if (!o) return;
  let hen = null;
  o.addEventListener('input', function () {
    clearTimeout(hen);
    hen = setTimeout(function () { xuLy(o.value.trim()); }, 180);
  });
}

/* Nút lọc dạng chip */
function chipLoc(loc, nhanChip, dangChon) {
  return '<button type="button" class="chip' + (dangChon ? ' dang-chon' : '') + '" data-loc="' + loc + '">' + nhanChip + '</button>';
}

/* Gắn sự kiện cho nhóm chip lọc */
function ganChip(idKhu, khiChon) {
  const khu = document.getElementById(idKhu);
  if (!khu) return;
  khu.addEventListener('click', function (e) {
    const b = e.target.closest('[data-loc]');
    if (!b) return;
    khiChon(b.dataset.loc);
  });
}

/* Khối trống */
function trangTrong(tieuDe, moTa, nut) {
  return '<div class="trang-trong"><p class="trang-trong__icon">○</p><h3>' + tieuDe + '</h3>' +
    '<p>' + (moTa || '') + '</p>' + (nut || '') + '</div>';
}

/* Bảng mô tả hai cột */
function danhSachMoTa(ds) {
  return '<dl class="ds-mo-ta">' + ds.map(function (m) {
    return '<div><dt>' + m[0] + '</dt><dd>' + (m[1] === undefined || m[1] === '' ? '—' : m[1]) + '</dd></div>';
  }).join('') + '</dl>';
}

/* ---------- Khung trang ---------- */

const TRANG_THEO_VAI_TRO = {
  admin: 'admin.html',
  quanly: 'quanly.html',
  khachthue: 'khachthue.html'
};

const TEN_VAI_TRO = {
  admin: 'Chủ trọ',
  quanly: 'Quản lý',
  khachthue: 'Khách thuê'
};

/* Dựng thanh trên + menu trái, kiểm tra quyền truy cập.
   Trả về người dùng hiện tại hoặc null nếu phải chuyển trang. */
function khoiTaoKhung(cauHinh) {
  const nd = DL.phien();
  if (!nd) {
    const tiep = encodeURIComponent(location.pathname.split('/').pop().split('?')[0] + location.search + location.hash);
    location.replace('dangnhap.html?tiep=' + tiep);
    return null;
  }
  if (nd.vaiTro !== cauHinh.vaiTro) {
    location.replace(TRANG_THEO_VAI_TRO[nd.vaiTro] || 'dangnhap.html');
    return null;
  }

  /* Thanh trên */
  const chuDau = (nd.hoTen || '?').trim().charAt(0).toUpperCase();
  const thanhTren = document.querySelector('.thanh-tren');
  if (thanhTren) {
    thanhTren.innerHTML =
      '<div class="thanh-tren__noi">' +
        '<a class="thuong-hieu" href="../index.html">An Cư<span>·</span></a>' +
        '<span class="thanh-tren__ngan">Quản lý phòng trọ</span>' +
        '<div class="thanh-tren__phai">' +
          '<span class="thanh-tren__nguoi"><span class="avatar">' + thoat(chuDau) + '</span>' + thoat(nd.hoTen) + '</span>' +
          '<button class="nut-tren" id="nutDangXuat">Đăng xuất</button>' +
        '</div>' +
      '</div>';
    document.getElementById('nutDangXuat').onclick = function () {
      hoi('Đăng xuất?', 'Bạn sẽ quay về trang giới thiệu.', 'Đăng xuất').then(function (dongY) {
        if (!dongY) return;
        DL.dangXuat();
        location.href = '../index.html';
      });
    };
  }

  /* Menu trái */
  const menu = document.getElementById('menuTrai');
  if (menu) {
    let html = '<div class="menu__dau"><p class="menu__vai-tro">' + TEN_VAI_TRO[nd.vaiTro] + '</p>' +
      '<p class="menu__ten">' + thoat(nd.hoTen) + '</p></div>';
    cauHinh.menu.forEach(function (nhom) {
      html += '<div class="menu__nhom"><p class="menu__nhan">' + nhom.nhom + '</p>';
      nhom.muc.forEach(function (m) {
        html += '<button type="button" class="menu__muc" data-man="' + m.id + '">' + m.ten + '</button>';
      });
      html += '</div>';
    });
    html += '<div class="menu__cuoi"><a class="menu__lien-ket" href="../index.html">Về trang giới thiệu</a></div>';
    menu.innerHTML = html;
    menu.addEventListener('click', function (e) {
      const b = e.target.closest('[data-man]');
      if (b) chuyenManHinh(b.dataset.man);
    });
  }

  /* Bắt buộc đổi mật khẩu tạm */
  if (nd.phaiDoiMatKhau) {
    hienDoiMatKhauBatBuoc(nd);
    return null;
  }
  return nd;
}

/* Chuyển màn hình, chỉ thay nội dung trong #noidung */
function chuyenManHinh(ten) {
  const ds = window.cacManHinh || {};
  if (!ds[ten]) return;
  document.querySelectorAll('.menu__muc').forEach(function (b) {
    b.classList.toggle('dang-chon', b.dataset.man === ten);
  });
  const khu = document.getElementById('noidung');
  khu.innerHTML = '<div class="dang-tai"><span class="dang-tai__cham"></span>Đang tải…</div>';
  if (location.hash !== '#' + ten) history.replaceState(null, '', '#' + ten);
  window.scrollTo(0, 0);
  try {
    ds[ten]();
  } catch (e) {
    console.error(e);
    khu.innerHTML = '<div class="man">' + trangTrong('Có lỗi khi tải màn hình', 'Vui lòng tải lại trang và thử lại.') + '</div>';
  }
}

/* Bắt buộc đổi mật khẩu trước khi dùng hệ thống */
function hienDoiMatKhauBatBuoc(nd) {
  const lop = document.createElement('div');
  lop.className = 'lop-phu lop-phu--khoa';
  lop.innerHTML =
    '<div class="hop hop--hep">' +
      '<div class="hop__dau"><div><h2 class="hop__tieu-de">Đổi mật khẩu trước khi tiếp tục</h2>' +
      '<p class="hop__mo-ta">Tài khoản của bạn đang dùng mật khẩu tạm. Hãy đặt mật khẩu riêng (tối thiểu 8 ký tự).</p></div></div>' +
      '<div class="hop__than">' +
        '<form id="formDoiBatBuoc" class="bieu-mau">' +
          '<div class="nhom"><label for="mkMoi">Mật khẩu mới</label><input id="mkMoi" type="password" class="o-nhap" autocomplete="new-password"></div>' +
          '<div class="nhom"><label for="mkLai">Nhập lại mật khẩu mới</label><input id="mkLai" type="password" class="o-nhap" autocomplete="new-password"></div>' +
          '<p class="loi" id="loiDoi" hidden></p>' +
        '</form>' +
      '</div>' +
      '<div class="hop__chan"><button class="nut nut--chinh" id="luuDoiBatBuoc">Đổi mật khẩu</button></div>' +
    '</div>';
  document.body.appendChild(lop);
  document.getElementById('luuDoiBatBuoc').onclick = function () {
    const moi = giaTri('mkMoi');
    const lai = giaTri('mkLai');
    const loi = document.getElementById('loiDoi');
    function baoLoi(chu) { loi.hidden = false; loi.textContent = chu; }
    if (moi.length < 8) return baoLoi('Mật khẩu mới phải có ít nhất 8 ký tự.');
    if (moi !== lai) return baoLoi('Hai lần nhập mật khẩu không khớp.');
    if (moi === nd.matKhau) return baoLoi('Mật khẩu mới không được trùng mật khẩu tạm.');
    DL.doiMatKhau(nd.id, moi);
    thongBao('Đã đổi mật khẩu. Chào mừng bạn!');
    setTimeout(function () { location.reload(); }, 500);
  };
}

/* ---------- Mật khẩu tạm ---------- */

/* Hiện mật khẩu tạm một lần, kèm nút sao chép. xong: hàm gọi khi đóng */
function hienMatKhauTam(tenDangNhap, matKhau, hoTen, xong) {
  const lop = moHop({
    tieuDe: 'Đã cấp mật khẩu tạm',
    moTa: 'Mật khẩu chỉ hiển thị một lần. Hãy sao chép và gửi cho ' + thoat(hoTen) + '.',
    noiDung:
      '<div class="khoi-mat-khau">' +
        '<p class="khoi-mat-khau__nhan">Tên đăng nhập</p>' +
        '<div class="khoi-mat-khau__dong"><code>' + thoat(tenDangNhap) + '</code>' +
        '<button type="button" class="nut nut--ngoc nut--nho" data-chep-ten>Sao chép</button></div>' +
        '<p class="khoi-mat-khau__nhan">Mật khẩu tạm</p>' +
        '<div class="khoi-mat-khau__dong"><code class="khoi-mat-khau__mk">' + thoat(matKhau) + '</code>' +
        '<button type="button" class="nut nut--ngoc nut--nho" data-chep-mk>Sao chép</button></div>' +
        '<p class="ghi-chu-nho">Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.</p>' +
      '</div>',
    chanTrang: '<button class="nut nut--chinh" data-dong>Đã hiểu</button>'
  });
  lop.querySelector('[data-chep-ten]').onclick = function () { saoChep(tenDangNhap); };
  lop.querySelector('[data-chep-mk]').onclick = function () { saoChep(matKhau); };
  lop._khiDong = function () { if (typeof xong === 'function') xong(); };
}

/* ---------- In hợp đồng ---------- */

function inHopDong(hd) {
  const p = DL.tim('phong', hd.phongId);
  const k = DL.tim('khach', hd.khachId);
  if (!p || !k) { thongBao('Không tìm thấy dữ liệu hợp đồng.', 'loi'); return; }
  const html =
    '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>' + thoat(hd.ma) + '</title>' +
    '<style>' +
      'body{font-family:"Times New Roman",serif;font-size:14px;line-height:1.6;color:#111;margin:32px 44px}' +
      'h1{font-size:22px;text-align:center;margin:0 0 4px}h2{font-size:15px;margin:18px 0 6px}' +
      '.phu{text-align:center;font-size:13px;color:#555;margin-bottom:22px}' +
      '.hai-cot{display:grid;grid-template-columns:1fr 1fr;gap:20px}' +
      'table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}' +
      'th{background:#f3f3f3;font-weight:600}.ky{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:38px;text-align:center}' +
      '.ky p{margin:0}.ky .ten{margin-top:70px;font-weight:600}' +
      'ul{margin:6px 0 6px 18px;padding:0}' +
    '</style></head><body>' +
    '<h1>HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>' +
    '<p class="phu">Số: ' + thoat(hd.ma) + ' · Ngày ký: ' + ngay(hd.ngayKy) + '</p>' +
    '<p>Hôm nay, ngày ' + ngay(hd.ngayKy) + ', tại ' + thoat(hd.diaChiChuNha) + ', chúng tôi gồm:</p>' +
    '<h2>Bên cho thuê (Bên A)</h2>' +
    '<p>Ông/Bà: <b>' + thoat(hd.chuNha) + '</b><br>CCCD: ' + thoat(hd.cccdChuNha) +
    '<br>Địa chỉ: ' + thoat(hd.diaChiChuNha) + '<br>Điện thoại: ' + thoat(hd.sdtChuNha) + '</p>' +
    '<h2>Bên thuê (Bên B)</h2>' +
    '<p>Ông/Bà: <b>' + thoat(k.hoTen) + '</b><br>CCCD: ' + thoat(k.cccd) +
    '<br>Địa chỉ: ' + thoat(k.diaChi) + '<br>Điện thoại: ' + thoat(k.sdt) +
    (hd.nguoiOCung ? '<br>Người ở cùng: ' + thoat(hd.nguoiOCung) : '') +
    '<br>Số người tối đa: ' + thoat(hd.soNguoiToiDa) + '</p>' +
    '<h2>Điều 1 — Tài sản thuê</h2>' +
    '<p>Bên A cho Bên B thuê phòng <b>' + thoat(p.ma) + ' — ' + thoat(p.ten) + '</b> tại ' +
    thoat(hd.diaChiChuNha) + ', diện tích ' + thoat(p.dienTich) + ' m², mục đích: ' + thoat(hd.mucDich) + '.</p>' +
    '<h2>Điều 2 — Thời hạn và giá thuê</h2>' +
    '<table><tr><th>Thời hạn</th><td>Từ ' + ngay(hd.ngayBatDau) + ' đến ' + ngay(hd.ngayKetThuc) + '</td></tr>' +
    '<tr><th>Tiền thuê</th><td>' + tien(hd.tienThue) + ' / tháng</td></tr>' +
    '<tr><th>Tiền cọc</th><td>' + tien(hd.tienCoc) + '</td></tr>' +
    '<tr><th>Hạn thanh toán</th><td>Ngày ' + thoat(hd.hanThanhToan) + ' hằng tháng</td></tr>' +
    '<tr><th>Phương thức</th><td>' + thoat(hd.phuongThuc) + '</td></tr>' +
    '<tr><th>Tài khoản nhận tiền</th><td>' + thoat(hd.taiKhoanNhan) + '</td></tr>' +
    '<tr><th>Giá điện / nước</th><td>' + tien(hd.giaDien) + ' / kWh · ' + tien(hd.giaNuoc) + ' / m³</td></tr>' +
    '<tr><th>Phí dịch vụ</th><td>' + tien(hd.phiDichVu) + ' / tháng</td></tr></table>' +
    '<h2>Điều 3 — Bàn giao</h2>' +
    '<p>Ngày bàn giao: ' + ngay(hd.ngayBanGiao) + '<br>Hiện trạng: ' + thoat(hd.hienTrang) +
    '<br>Chỉ số bàn giao: ' + thoat(hd.chiSoBanGiao) + '</p>' +
    '<h2>Điều 4 — Quyền và nghĩa vụ</h2>' +
    '<p>' + thoat(hd.dieuKhoan) + '</p>' +
    '<h2>Điều 5 — Chấm dứt hợp đồng</h2>' +
    '<p>Báo trước: ' + thoat(hd.soNgayBaoTruoc) + ' ngày. Hoàn cọc trong ' + thoat(hd.soNgayHoanCoc) + ' ngày.<br>' +
    'Điều kiện chấm dứt sớm: ' + thoat(hd.dieuKienChamDut) + '<br>Khấu trừ cọc: ' + thoat(hd.khauTruCoc) + '</p>' +
    '<h2>Điều 6 — Thỏa thuận khác</h2>' +
    '<p>Trễ hạn: ' + thoat(hd.xuLyTreHan) + '<br>Tranh chấp: ' + thoat(hd.tranhChap) +
    (hd.boSung ? '<br>Bổ sung: ' + thoat(hd.boSung) : '') + '</p>' +
    '<div class="ky"><div><p>ĐẠI DIỆN BÊN A</p><p class="ten">' + thoat(hd.chuNha) + '</p></div>' +
    '<div><p>ĐẠI DIỆN BÊN B</p><p class="ten">' + thoat(k.hoTen) + '</p></div></div>' +
    '</body></html>';
  const cuaSo = window.open('', '_blank', 'width=900,height=1000');
  if (!cuaSo) { thongBao('Trình duyệt đã chặn cửa sổ in. Hãy cho phép rồi thử lại.', 'loi'); return; }
  cuaSo.document.open();
  cuaSo.document.write(html);
  cuaSo.document.close();
  setTimeout(function () { cuaSo.focus(); cuaSo.print(); }, 400);
}

/* Đóng hộp thoại bằng phím Esc */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') dongHop();
});

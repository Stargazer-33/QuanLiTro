/* ============================================================
   quanly.js — Trang quản lý: vận hành phòng, khách, hợp đồng,
   chỉ số điện nước, hóa đơn, gửi link, thanh toán, sự cố.
   ============================================================ */

const MENU_QUANLY = [
  { nhom: 'Vận hành', muc: [
    { id: 'phong', ten: 'Phòng' },
    { id: 'khach', ten: 'Khách thuê' },
    { id: 'hopdong', ten: 'Hợp đồng' },
    { id: 'suco', ten: 'Sự cố' }
  ] },
  { nhom: 'Điện nước & hóa đơn', muc: [
    { id: 'chiso', ten: 'Chỉ số điện nước' },
    { id: 'taohoadon', ten: 'Tạo hóa đơn' },
    { id: 'guilink', ten: 'Gửi link hóa đơn' },
    { id: 'thanhtoan', ten: 'Cập nhật thanh toán' }
  ] },
  { nhom: 'Cá nhân', muc: [
    { id: 'taikhoan', ten: 'Tài khoản' }
  ] }
];

const QUYEN_QUANLY = {
  xoaPhong: false, xoaKhach: false, hopDongDayDu: false,
  huyHoaDon: false, xoaHoaDon: false, taoSuCo: true,
  khoiPhucDuLieu: false
};

let TTChiSo = { ky: '', khuVuc: 'tatca' };
let TTGuiLink = { ky: '' };
let TTThanhToan = { ky: '' };
let TTTaoHoaDon = { ky: '' };

/* ============================================================
   GHI CHỈ SỐ ĐIỆN NƯỚC
   ============================================================ */

function manChiSo() {
  if (!TTChiSo.ky) TTChiSo.ky = thangNay();
  const ky = TTChiSo.ky;
  const phongDS = DL.lay('phong').filter(function (p) { return DL.hopDongHieuLuc(p.id); })
    .sort(function (a, b) { return a.ma.localeCompare(b.ma); });

  const khuVucDS = Array.from(new Set(phongDS.map(function (p) { return p.khuVuc; }))).sort();
  if (TTChiSo.khuVuc !== 'tatca' && khuVucDS.indexOf(TTChiSo.khuVuc) < 0) TTChiSo.khuVuc = 'tatca';

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Chỉ số điện nước', 'Chốt chỉ số theo kỳ. Hệ thống tự tính tiêu thụ và cảnh báo nếu chỉ số mới nhỏ hơn chỉ số cũ.',
        '<button class="nut nut--chinh" id="luuTatCaChiSo">Lưu tất cả</button>') +
      '<div class="toolbar"><div class="toolbar__trai">' +
        '<input id="kyChiSo" type="month" class="o-loc" value="' + ky + '">' +
        '<select id="khuVucChiSo" class="o-loc">' +
          '<option value="tatca">Tất cả khu vực</option>' +
          khuVucDS.map(function (k) {
            return '<option value="' + thoat(k) + '"' + (TTChiSo.khuVuc === k ? ' selected' : '') + '>' + thoat(k) + '</option>';
          }).join('') +
        '</select>' +
      '</div><span class="dem" id="demChiSo"></span></div>' +
      '<div id="khuChiSo"></div>' +
    '</div>';

  veChiSo();

  document.getElementById('kyChiSo').onchange = function (e) { TTChiSo.ky = e.target.value; manChiSo(); };
  document.getElementById('khuVucChiSo').onchange = function (e) { TTChiSo.khuVuc = e.target.value; veChiSo(); };
  document.getElementById('luuTatCaChiSo').onclick = luuTatCaChiSo;
}

function veChiSo() {
  const khu = document.getElementById('khuChiSo');
  if (!khu) return;
  const ky = TTChiSo.ky;
  const phongDS = DL.lay('phong').filter(function (p) { return DL.hopDongHieuLuc(p.id); })
    .filter(function (p) { return TTChiSo.khuVuc === 'tatca' || p.khuVuc === TTChiSo.khuVuc; })
    .sort(function (a, b) { return a.ma.localeCompare(b.ma); });

  if (!phongDS.length) {
    khu.innerHTML = trangTrong('Không có phòng đang thuê', 'Cần có hợp đồng hiệu lực để ghi chỉ số điện nước.');
    return;
  }

  let soDaChot = 0;
  const the = phongDS.map(function (p) {
    const hd = DL.hopDongHieuLuc(p.id);
    const k = hd ? DL.tim('khach', hd.khachId) : null;
    const g = DL.goiYChiSo(p.id, ky);
    if (g.daChot) soDaChot++;

    return '<div class="the-phong" data-phong="' + p.id + '" data-dau-dien="' + g.dienDau + '" data-dau-nuoc="' + g.nuocDau + '">' +
      '<div class="the-phong__dau">' +
        '<div><p class="the-phong__ma">' + thoat(p.ma) + '</p><p class="the-phong__ten">' + thoat(p.ten) + ' · ' + thoat(p.khuVuc) + '</p></div>' +
        (g.daChot ? nhan('Đã chốt', 'xanh-la') : nhan('Chưa chốt', 'cam')) +
      '</div>' +
      '<p class="the-phong__khach">' + (k ? 'Khách: ' + thoat(k.hoTen) : 'Chưa có khách') + '</p>' +
      '<div class="the-phong__chi-so">' +
        '<div class="the-phong__o"><label>Điện cũ</label><input class="o-nhap" value="' + g.dienDau + '" readonly></div>' +
        '<div class="the-phong__o"><label>Điện mới</label><input class="o-nhap" type="number" min="0" step="1" data-dien-moi value="' + g.dienCuoi + '"></div>' +
        '<div class="the-phong__o"><label>Nước cũ</label><input class="o-nhap" value="' + g.nuocDau + '" readonly></div>' +
        '<div class="the-phong__o"><label>Nước mới</label><input class="o-nhap" type="number" min="0" step="1" data-nuoc-moi value="' + g.nuocCuoi + '"></div>' +
      '</div>' +
      '<div class="the-phong__tieu-thu"><span>Tiêu thụ</span><span>Điện <b data-dien-tt>' + Math.max(0, g.dienCuoi - g.dienDau) + '</b> kWh · Nước <b data-nuoc-tt>' + Math.max(0, g.nuocCuoi - g.nuocDau) + '</b> m³</span></div>' +
      '<p class="ghi-chu-nho" data-canh-bao hidden></p>' +
      '<div class="the-phong__cuoi">' +
        '<span class="phu">Kỳ ' + kyDep(ky) + '</span>' +
        '<button class="nut nut--ngoc nut--nho" data-luu>Lưu phòng này</button>' +
      '</div>' +
    '</div>';
  }).join('');

  khu.innerHTML =
    luoiThongKe([
      { nhan: 'Phòng cần chốt', so: phongDS.length },
      { nhan: 'Đã chốt', so: soDaChot, lop: 'thong-ke__so--la' },
      { nhan: 'Chưa chốt', so: phongDS.length - soDaChot, lop: 'thong-ke__so--do' }
    ]) +
    '<div class="luoi-phong">' + the + '</div>';

  const oDem = document.getElementById('demChiSo');
  if (oDem) oDem.textContent = soDaChot + ' / ' + phongDS.length + ' phòng đã chốt';

  phongDS.forEach(function (p) {
    const card = khu.querySelector('[data-phong="' + p.id + '"]');
    if (!card) return;
    card.querySelectorAll('input[data-dien-moi], input[data-nuoc-moi]').forEach(function (o) {
      o.addEventListener('input', function () { capNhatTieuThu(card); });
    });
  });

  khu.onclick = function (e) {
    const b = e.target.closest('[data-luu]');
    if (!b) return;
    const card = b.closest('.the-phong');
    const kq = luuMotThe(card);
    if (kq) {
      capNhatTrangThaiThe(card);
      const demEl = document.getElementById('demChiSo');
      const daChot = khu.querySelectorAll('.the-phong .nhan--xanh-la').length;
      if (demEl) demEl.textContent = daChot + ' / ' + phongDS.length + ' phòng đã chốt';
    }
  };
}

/* Cập nhật số tiêu thụ hiển thị trên thẻ */
function capNhatTieuThu(card) {
  const dauDien = Number(card.dataset.dauDien) || 0;
  const dauNuoc = Number(card.dataset.dauNuoc) || 0;
  const moiDien = Number(card.querySelector('[data-dien-moi]').value);
  const moiNuoc = Number(card.querySelector('[data-nuoc-moi]').value);
  const ttDien = card.querySelector('[data-dien-tt]');
  const ttNuoc = card.querySelector('[data-nuoc-tt]');
  const canhBao = card.querySelector('[data-canh-bao]');

  ttDien.textContent = isNaN(moiDien) ? '—' : Math.max(0, moiDien - dauDien);
  ttNuoc.textContent = isNaN(moiNuoc) ? '—' : Math.max(0, moiNuoc - dauNuoc);

  if ((!isNaN(moiDien) && moiDien < dauDien) || (!isNaN(moiNuoc) && moiNuoc < dauNuoc)) {
    card.classList.add('the-phong--canh-bao');
    canhBao.hidden = false;
    canhBao.textContent = 'Chỉ số mới nhỏ hơn chỉ số cũ. Vui lòng kiểm tra lại.';
  } else {
    card.classList.remove('the-phong--canh-bao');
    canhBao.hidden = true;
  }
}

/* Đọc và kiểm tra một thẻ, trả về dữ liệu hoặc null */
function docTheChiSo(card) {
  const p = DL.tim('phong', card.dataset.phong);
  const dauDien = Number(card.dataset.dauDien) || 0;
  const dauNuoc = Number(card.dataset.dauNuoc) || 0;
  const moiDien = Number(card.querySelector('[data-dien-moi]').value);
  const moiNuoc = Number(card.querySelector('[data-nuoc-moi]').value);
  const ten = p ? p.ma : 'phòng';
  if (isNaN(moiDien) || isNaN(moiNuoc)) { return { loi: ten + ': chỉ số không hợp lệ.' }; }
  if (moiDien < dauDien) { return { loi: ten + ': chỉ số điện mới nhỏ hơn chỉ số cũ.' }; }
  if (moiNuoc < dauNuoc) { return { loi: ten + ': chỉ số nước mới nhỏ hơn chỉ số cũ.' }; }
  return { phongId: card.dataset.phong, dauDien: dauDien, dauNuoc: dauNuoc, moiDien: moiDien, moiNuoc: moiNuoc };
}

function luuMotThe(card) {
  const d = docTheChiSo(card);
  if (d.loi) { thongBao(d.loi, 'loi'); return false; }
  DL.luuChiSo(d.phongId, TTChiSo.ky, {
    dienDau: d.dauDien, dienCuoi: d.moiDien,
    nuocDau: d.dauNuoc, nuocCuoi: d.moiNuoc,
    ngayChot: homNay()
  });
  thongBao('Đã lưu chỉ số ' + (DL.tim('phong', d.phongId) || {}).ma + '.');
  return true;
}

function capNhatTrangThaiThe(card) {
  const nhanCu = card.querySelector('.the-phong__dau .nhan');
  if (nhanCu) {
    nhanCu.className = 'nhan nhan--xanh-la';
    nhanCu.textContent = 'Đã chốt';
  }
}

function luuTatCaChiSo() {
  const theDS = document.querySelectorAll('#khuChiSo .the-phong');
  const duLieu = [];
  let loiDau = '';
  theDS.forEach(function (card) {
    const d = docTheChiSo(card);
    if (d.loi) { if (!loiDau) loiDau = d.loi; }
    else duLieu.push(d);
  });
  if (loiDau) { thongBao(loiDau, 'loi'); return; }
  if (!duLieu.length) { thongBao('Không có phòng nào để lưu.', 'loi'); return; }
  duLieu.forEach(function (d) {
    DL.luuChiSo(d.phongId, TTChiSo.ky, {
      dienDau: d.dauDien, dienCuoi: d.moiDien,
      nuocDau: d.dauNuoc, nuocCuoi: d.moiNuoc,
      ngayChot: homNay()
    });
  });
  thongBao('Đã lưu chỉ số ' + duLieu.length + ' phòng.');
  veChiSo();
}

/* ============================================================
   TẠO HÓA ĐƠN
   ============================================================ */

function manTaoHoaDon() {
  if (!TTTaoHoaDon.ky) TTTaoHoaDon.ky = thangNay();
  const ky = TTTaoHoaDon.ky;
  const phongDS = DL.lay('phong').filter(function (p) { return DL.hopDongHieuLuc(p.id); })
    .sort(function (a, b) { return a.ma.localeCompare(b.ma); });

  const daLap = phongDS.filter(function (p) { return DL.hoaDonTrongKy(p.id, ky); }).length;

  const the = phongDS.map(function (p) {
    const hd = DL.hopDongHieuLuc(p.id);
    const k = hd ? DL.tim('khach', hd.khachId) : null;
    const hdDaCo = DL.hoaDonTrongKy(p.id, ky);
    const g = DL.goiYChiSo(p.id, ky);
    const tinh = DL.tinhTong({
      tienThue: hd.tienThue, giaDien: hd.giaDien, giaNuoc: hd.giaNuoc,
      phiDichVu: hd.phiDichVu, soDien: g.soDien, soNuoc: g.soNuoc
    });

    return '<div class="the-phong">' +
      '<div class="the-phong__dau">' +
        '<div><p class="the-phong__ma">' + thoat(p.ma) + '</p><p class="the-phong__ten">' + thoat(p.ten) + ' · ' + thoat(p.khuVuc) + '</p></div>' +
        (hdDaCo ? nhanHoaDon(hdDaCo) : (g.daChot ? nhan('Sẵn sàng lập', 'xanh') : nhan('Chưa ghi chỉ số', 'cam'))) +
      '</div>' +
      '<p class="the-phong__khach">' + (k ? thoat(k.hoTen) : '—') + '</p>' +
      '<div class="khoi-tien" style="margin-top:12px;padding:12px 14px">' +
        '<div class="dong-tien"><span>Tiền phòng</span><b>' + tien(hd.tienThue) + '</b></div>' +
        '<div class="dong-tien"><span>Điện ' + g.soDien + ' kWh</span><b>' + tien(tinh.tienDien) + '</b></div>' +
        '<div class="dong-tien"><span>Nước ' + g.soNuoc + ' m³</span><b>' + tien(tinh.tienNuoc) + '</b></div>' +
        '<div class="dong-tien"><span>Phí dịch vụ</span><b>' + tien(hd.phiDichVu) + '</b></div>' +
        '<div class="dong-tien dong-tien--tong" style="padding-top:8px"><span>Tổng</span><b>' + tien(tinh.tong) + '</b></div>' +
      '</div>' +
      '<div class="the-phong__cuoi">' +
        (hdDaCo
          ? '<span class="phu">Đã lập hóa đơn</span><button class="nut nut--ngoc nut--nho" data-xem="' + hdDaCo.id + '">Xem</button>'
          : '<span class="phu">' + (g.daChot ? 'Đã chốt chỉ số' : 'Chưa chốt chỉ số') + '</span><button class="nut nut--chinh nut--nho" data-tao="' + p.id + '">Tạo hóa đơn</button>') +
      '</div>' +
    '</div>';
  }).join('');

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Tạo hóa đơn', 'Mỗi phòng một hóa đơn trong một kỳ. Hệ thống tự lấy khách, đơn giá và tính tổng.',
        '<button class="nut nut--chinh" id="taoHoaDonMoi">Tạo hóa đơn</button>') +
      '<div class="toolbar"><div class="toolbar__trai">' +
        '<input id="kyTaoHoaDon" type="month" class="o-loc" value="' + ky + '">' +
      '</div><span class="dem">' + daLap + ' / ' + phongDS.length + ' phòng đã lập</span></div>' +
      luoiThongKe([
        { nhan: 'Phòng cần lập', so: phongDS.length },
        { nhan: 'Đã lập', so: daLap, lop: 'thong-ke__so--la' },
        { nhan: 'Chưa lập', so: phongDS.length - daLap, lop: 'thong-ke__so--do' }
      ]) +
      (phongDS.length ? '<div class="luoi-phong">' + the + '</div>'
        : trangTrong('Chưa có phòng đang thuê', 'Cần có hợp đồng hiệu lực để tạo hóa đơn.')) +
    '</div>';

  document.getElementById('kyTaoHoaDon').onchange = function (e) { TTTaoHoaDon.ky = e.target.value; manTaoHoaDon(); };
  document.getElementById('taoHoaDonMoi').onclick = function () {
    moTaoHoaDon(QUYEN_QUANLY, manTaoHoaDon, { ky: ky });
  };

  khu.onclick = function (e) {
    const tao = e.target.closest('[data-tao]');
    const xem = e.target.closest('[data-xem]');
    if (tao) moTaoHoaDon(QUYEN_QUANLY, manTaoHoaDon, { ky: ky, phongId: tao.dataset.tao });
    if (xem) moChiTietHoaDon(DL.tim('hoadon', xem.dataset.xem), QUYEN_QUANLY, manTaoHoaDon);
  };
}

/* ============================================================
   GỬI LINK HÓA ĐƠN
   ============================================================ */

function taoLinkHoaDon(hd) {
  return new URL('khachthue.html?hoadon=' + encodeURIComponent(hd.id), location.href).href;
}

function noiDungGuiHoaDon(hd) {
  const p = DL.tim('phong', hd.phongId);
  const k = DL.tim('khach', hd.khachId);
  return 'Kính gửi anh/chị ' + (k ? k.hoTen : '') + ',\n' +
    'Hóa đơn kỳ ' + kyDep(hd.ky) + ' của phòng ' + (p ? p.ma : '') + ' là ' + tien(hd.tong) + '.\n' +
    'Hạn thanh toán: ' + ngay(hd.han) + '.\n' +
    'Xem chi tiết hóa đơn tại: ' + taoLinkHoaDon(hd) + '\n' +
    'Trân trọng cảm ơn.';
}

function manGuiLink() {
  if (!TTGuiLink.ky) TTGuiLink.ky = thangNay();
  const ky = TTGuiLink.ky;
  const ds = DL.lay('hoadon').filter(function (h) {
    return h.ky === ky && h.trangThai !== 'huy';
  }).sort(function (a, b) { return a.ma.localeCompare(b.ma); });

  const daGui = ds.filter(function (h) { return h.daGui; }).length;
  const luotMo = ds.reduce(function (t, h) { return t + (Number(h.luotMo) || 0); }, 0);

  const dong = ds.map(function (h) {
    const p = DL.tim('phong', h.phongId);
    const k = DL.tim('khach', h.khachId);
    return [
      p ? thoat(p.ma) : '—',
      '<strong>' + thoat(h.ma) + '</strong>',
      k ? thoat(k.hoTen) : '—',
      '<span class="so">' + tien(h.tong) + '</span>',
      h.daGui ? nhan('Đã gửi', 'xanh-la') : nhan('Chưa gửi', 'cam'),
      (h.luotMo || 0) > 0 ? thoat(h.luotMo) + ' lượt' : '<span class="phu">—</span>',
      '<div class="nhom-nut">' +
        '<button class="nut nut--ngoc nut--nho" data-xem-truoc="' + h.id + '">Xem trước</button>' +
        (h.daGui ? '' : '<button class="nut nut--ngoc nut--nho" data-gui="' + h.id + '">Đánh dấu đã gửi</button>') +
      '</div>'
    ];
  });

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Gửi link hóa đơn', 'Sao chép nội dung và link rồi gửi qua Zalo, SMS hoặc Email. Khách phải đăng nhập mới mở được hóa đơn của mình.',
        '<button class="nut nut--ngoc" id="guiTatCa">Đánh dấu tất cả đã gửi</button>') +
      '<div class="toolbar"><div class="toolbar__trai">' +
        '<input id="kyGuiLink" type="month" class="o-loc" value="' + ky + '">' +
      '</div><span class="dem">' + ds.length + ' hóa đơn trong kỳ</span></div>' +
      luoiThongKe([
        { nhan: 'Cần gửi', so: ds.length - daGui, lop: 'thong-ke__so--do' },
        { nhan: 'Đã gửi', so: daGui, lop: 'thong-ke__so--la' },
        { nhan: 'Lượt khách mở link', so: luotMo, ghiChu: 'Tính trên các hóa đơn trong kỳ' }
      ]) +
      (ds.length
        ? bangHtml(['Phòng', 'Mã hóa đơn', 'Khách', 'Tổng', 'Trạng thái gửi', 'Lượt mở', ''], dong)
        : trangTrong('Chưa có hóa đơn trong kỳ', 'Chọn tháng khác hoặc tạo hóa đơn trước.')) +
    '</div>';

  document.getElementById('kyGuiLink').onchange = function (e) { TTGuiLink.ky = e.target.value; manGuiLink(); };

  const nutTatCa = document.getElementById('guiTatCa');
  nutTatCa.onclick = async function () {
    if (!ds.length || daGui === ds.length) { thongBao('Không còn hóa đơn cần đánh dấu.', 'loi'); return; }
    const dongY = await hoi('Đánh dấu tất cả đã gửi?', 'Tất cả hóa đơn trong kỳ ' + kyDep(ky) + ' sẽ được đánh dấu “Đã gửi”.', 'Đánh dấu');
    if (!dongY) return;
    ds.forEach(function (h) { if (!h.daGui) DL.sua('hoadon', h.id, { daGui: true }); });
    thongBao('Đã cập nhật trạng thái gửi.');
    manGuiLink();
  };

  khu.onclick = function (e) {
    const xemTruoc = e.target.closest('[data-xem-truoc]');
    const danhDau = e.target.closest('[data-gui]');
    if (xemTruoc) moGuiHoaDon(DL.tim('hoadon', xemTruoc.dataset.xemTruoc), function () { manGuiLink(); });
    if (danhDau) {
      const h = DL.tim('hoadon', danhDau.dataset.gui);
      DL.sua('hoadon', h.id, { daGui: true });
      thongBao('Đã đánh dấu hóa đơn ' + h.ma + ' là đã gửi.');
      manGuiLink();
    }
  };
}

/* Xem trước nội dung gửi khách */
function moGuiHoaDon(hd, xong) {
  if (!hd) return;
  const noiDung = noiDungGuiHoaDon(hd);
  const link = taoLinkHoaDon(hd);
  const lop = moHop({
    tieuDe: 'Gửi hóa đơn ' + thoat(hd.ma),
    moTa: 'Chọn kênh, sao chép nội dung hoặc link rồi gửi cho khách bằng ứng dụng của bạn.',
    noiDung:
      '<div class="nhom" style="margin-bottom:14px"><label for="kenhGui">Kênh gửi</label>' +
        '<select id="kenhGui" class="o-chon"><option>Zalo</option><option>SMS</option><option>Email</option></select></div>' +
      '<div class="nhom"><label for="noiDungGui">Nội dung tin nhắn</label>' +
        '<textarea id="noiDungGui" class="o-vung" rows="6" style="min-height:150px" readonly>' + thoat(noiDung) + '</textarea></div>' +
      '<div class="nhom" style="margin-top:14px"><label>Link hóa đơn</label>' +
        '<div class="khoi-mat-khau__dong"><code style="font-size:12px">' + thoat(link) + '</code>' +
        '<button type="button" class="nut nut--ngoc nut--nho" data-chep-link>Sao chép</button></div></div>' +
      '<p class="ghi-chu-nho">Khách mở link sẽ được đưa tới trang đăng nhập rồi vào đúng hóa đơn của mình.</p>',
    chanTrang:
      '<button class="nut nut--ngoc" data-dong>Đóng</button>' +
      '<button class="nut nut--ngoc" id="guiChep">Sao chép nội dung</button>' +
      '<button class="nut nut--chinh" id="guiXong">Đã gửi</button>'
  });

  lop.querySelector('[data-chep-link]').onclick = function () { saoChep(link); };
  document.getElementById('guiChep').onclick = function () { saoChep(noiDung); };
  document.getElementById('guiXong').onclick = function () {
    DL.sua('hoadon', hd.id, { daGui: true });
    dongHop();
    thongBao('Đã đánh dấu hóa đơn là đã gửi.');
    if (xong) xong();
  };
}

/* ============================================================
   CẬP NHẬT THANH TOÁN (KANBAN)
   ============================================================ */

function manThanhToan() {
  if (!TTThanhToan.ky) TTThanhToan.ky = thangNay();
  const ky = TTThanhToan.ky;
  const ds = DL.lay('hoadon').filter(function (h) {
    return h.ky === ky && h.trangThai !== 'huy';
  });

  const daThu = ds.reduce(function (t, h) { return t + DL.daThu(h.id); }, 0);
  const chuaThu = ds.filter(function (h) { return DL.cotKanban(h) === 'chua'; });
  const quaHan = ds.filter(function (h) { return DL.cotKanban(h) === 'qua'; });
  const tongChuaThu = chuaThu.reduce(function (t, h) { return t + DL.conNo(h); }, 0);
  const tongQuaHan = quaHan.reduce(function (t, h) { return t + DL.conNo(h); }, 0);

  const cot = [
    { id: 'chua', ten: 'Chưa thanh toán' },
    { id: 'mot', ten: 'Trả một phần' },
    { id: 'qua', ten: 'Quá hạn' },
    { id: 'da', ten: 'Đã thanh toán' }
  ];

  const kanban = cot.map(function (c) {
    const dsCot = ds.filter(function (h) { return DL.cotKanban(h) === c.id; })
      .sort(function (a, b) { return a.han < b.han ? -1 : 1; });

    const the = dsCot.map(function (h) {
      const p = DL.tim('phong', h.phongId);
      const k = DL.tim('khach', h.khachId);
      const tt = DL.trangThaiHoaDon(h);
      return '<div class="the-kanban">' +
        '<div class="the-kanban__dau"><span class="the-kanban__phong">' + (p ? thoat(p.ma) : '—') + '</span>' +
          '<span class="the-kanban__ma">' + thoat(h.ma) + '</span></div>' +
        '<p class="the-kanban__ten">' + (k ? thoat(k.hoTen) : '—') + '</p>' +
        '<div class="the-kanban__tien">' +
          '<span>Tổng <b>' + tien(h.tong) + '</b></span>' +
          '<span>Đã thu <b>' + tien(tt.daThu) + '</b></span>' +
          '<span>Còn lại <b>' + tien(tt.con) + '</b></span>' +
        '</div>' +
        '<p class="the-kanban__han">Hạn: ' + ngay(h.han) + '</p>' +
        (tt.con > 0
          ? '<div class="the-kanban__nut">' +
              '<button class="nut nut--chinh" data-thu-du="' + h.id + '">Thu đủ</button>' +
              '<button class="nut nut--ngoc" data-thu-mot="' + h.id + '">Thu một phần</button>' +
            '</div>'
          : '') +
      '</div>';
    }).join('');

    return '<div class="cot-kanban"><div class="cot-kanban__dau"><h3>' + c.ten + '</h3>' +
      '<span class="cot-kanban__dem">' + dsCot.length + '</span></div>' +
      (the || '<p class="cot-trong">Không có hóa đơn</p>') + '</div>';
  }).join('');

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Cập nhật thanh toán', 'Theo dõi hóa đơn theo bốn cột. Thẻ quá hạn nằm ở cột “Quá hạn” cho tới khi thu đủ.',
        '<button class="nut nut--ngoc" id="lamMoiThanhToan">Làm mới</button>') +
      '<div class="toolbar"><div class="toolbar__trai">' +
        '<input id="kyThanhToan" type="month" class="o-loc" value="' + ky + '">' +
      '</div><span class="dem">' + ds.length + ' hóa đơn trong kỳ</span></div>' +
      luoiThongKe([
        { nhan: 'Đã thu trong kỳ', so: tien(daThu), lop: 'thong-ke__so--la' },
        { nhan: 'Chưa thu', so: chuaThu.length + ' phòng', ghiChu: tien(tongChuaThu), lop: 'thong-ke__so--xanh' },
        { nhan: 'Quá hạn', so: quaHan.length + ' phòng', ghiChu: tien(tongQuaHan), lop: 'thong-ke__so--do' }
      ]) +
      '<div class="kanban" style="margin-top:8px">' + kanban + '</div>' +
    '</div>';

  document.getElementById('kyThanhToan').onchange = function (e) { TTThanhToan.ky = e.target.value; manThanhToan(); };
  document.getElementById('lamMoiThanhToan').onclick = function () { manThanhToan(); };

  khu.onclick = function (e) {
    const thuDu = e.target.closest('[data-thu-du]');
    const thuMot = e.target.closest('[data-thu-mot]');
    if (thuDu) thuDuHoaDon(DL.tim('hoadon', thuDu.dataset.thuDu));
    if (thuMot) moThanhToan(DL.tim('hoadon', thuMot.dataset.thuMot), function () { manThanhToan(); });
  };
}

/* Thu đủ toàn bộ số còn nợ, có xác nhận */
async function thuDuHoaDon(hd) {
  if (!hd) return;
  const tt = DL.trangThaiHoaDon(hd);
  if (tt.con <= 0) { thongBao('Hóa đơn đã thanh toán đủ.', 'loi'); return; }
  const dongY = await hoi(
    'Xác nhận thu đủ?',
    'Ghi nhận thanh toán <b>' + tien(tt.con) + '</b> cho hóa đơn <b>' + thoat(hd.ma) + '</b>.',
    'Thu đủ'
  );
  if (!dongY) return;
  const hdGoc = DL.hopDongHieuLuc(hd.phongId);
  DL.them('thanhtoan', {
    hoaDonId: hd.id, soTien: tt.con,
    phuongThuc: hdGoc ? hdGoc.phuongThuc : 'Tiền mặt',
    ghiChu: 'Thu đủ', ngay: homNay()
  });
  thongBao('Đã thu đủ ' + tien(tt.con) + '.');
  manThanhToan();
}

/* ============================================================
   KHỞI ĐỘNG TRANG
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const nd = khoiTaoKhung({ vaiTro: 'quanly', menu: MENU_QUANLY, tenVaiTro: 'Quản lý' });
  if (!nd) return;

  window.cacManHinh = {
    phong: function () { manPhong(QUYEN_QUANLY); },
    khach: function () { manKhach(QUYEN_QUANLY); },
    hopdong: function () { manHopDong(QUYEN_QUANLY); },
    suco: function () { manSuCo(QUYEN_QUANLY); },
    chiso: manChiSo,
    taohoadon: manTaoHoaDon,
    guilink: manGuiLink,
    thanhtoan: manThanhToan,
    taikhoan: function () { manTaiKhoan(QUYEN_QUANLY); }
  };

  window.addEventListener('hashchange', function () {
    const ten = location.hash.slice(1);
    if (window.cacManHinh[ten]) chuyenManHinh(ten);
  });

  const dau = (location.hash || '#phong').slice(1);
  chuyenManHinh(window.cacManHinh[dau] ? dau : 'phong');
});

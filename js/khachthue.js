/* ============================================================
   khachthue.js — Trang khách thuê: chỉ xem dữ liệu của chính mình,
   xem hóa đơn, hợp đồng, chỉ số, thông báo và gửi sự cố.
   ============================================================ */

const MENU_KHACH = [
  { nhom: 'Phòng của tôi', muc: [
    { id: 'tongquan', ten: 'Tổng quan' },
    { id: 'hoadon', ten: 'Hóa đơn' },
    { id: 'hopdong', ten: 'Hợp đồng' },
    { id: 'chiso', ten: 'Điện nước' }
  ] },
  { nhom: 'Liên hệ', muc: [
    { id: 'thongbao', ten: 'Thông báo' },
    { id: 'suco', ten: 'Báo sự cố' },
    { id: 'thanhvien', ten: 'Thành viên ở cùng' }
  ] },
  { nhom: 'Tài khoản', muc: [
    { id: 'canhan', ten: 'Thông tin cá nhân' }
  ] }
];

/* Khách đang đăng nhập */
function layKhachHienTai() {
  const nd = DL.phien();
  if (!nd || !nd.hoSoId) return null;
  return DL.tim('khach', nd.hoSoId);
}

function manChan(tieuDe, moTa) {
  const khu = document.getElementById('noidung');
  khu.innerHTML = '<div class="man">' + trangTrong(tieuDe, moTa,
    '<a class="nut nut--ngoc" href="dangnhap.html">Về trang đăng nhập</a>') + '</div>';
}

/* Trạng thái hợp đồng */
function trangThaiHopDongKhach(h) {
  if (!h) return { chu: 'Chưa có hợp đồng', loai: '' };
  if (h.trangThai === 'ketthuc') return { chu: 'Đã kết thúc', loai: '' };
  const con = soNgayCon(h.ngayKetThuc);
  if (con < 0) return { chu: 'Đã hết hạn', loai: 'do' };
  if (con <= 30) return { chu: 'Sắp hết hạn · còn ' + con + ' ngày', loai: 'cam' };
  return { chu: 'Đang hiệu lực · còn ' + con + ' ngày', loai: 'xanh-la' };
}

function hopDongCuaKhachHienTai(k) {
  return DL.hopDongCuaKhach(k.id) || null;
}

function hoaDonCuaKhach(k) {
  return DL.lay('hoadon').filter(function (h) { return h.khachId === k.id && h.trangThai !== 'huy'; });
}

/* ============================================================
   TỔNG QUAN
   ============================================================ */

function manKhachTongQuan() {
  const k = layKhachHienTai();
  if (!k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Tài khoản của bạn chưa được liên kết với hồ sơ khách thuê. Vui lòng liên hệ chủ trọ để được hỗ trợ.');

  const hd = hopDongCuaKhachHienTai(k);
  if (!hd || !k.phongId) {
    const khu = document.getElementById('noidung');
    khu.innerHTML =
      '<div class="man">' +
        dauMan('Xin chào, ' + thoat(k.hoTen), 'Tài khoản đã sẵn sàng.') +
        '<div style="margin-top:24px">' +
          trangTrong('Đang chờ xếp phòng', 'Bạn chưa được xếp phòng hoặc chưa có hợp đồng hiệu lực. Vui lòng liên hệ chủ trọ để hoàn tất thủ tục.',
            '<a class="nut nut--ngoc" href="#thongbao" data-di="thongbao">Xem thông báo</a>') +
        '</div>' +
      '</div>';
    khu.onclick = function (e) {
      const b = e.target.closest('[data-di]');
      if (b) { e.preventDefault(); chuyenManHinh(b.dataset.di); }
    };
    return;
  }

  const p = DL.tim('phong', hd.phongId);
  const dsHd = hoaDonCuaKhach(k).sort(function (a, b) { return a.ky < b.ky ? 1 : -1; });
  const moiNhat = dsHd[0];
  const congNo = dsHd.reduce(function (t, h) { return t + DL.conNo(h); }, 0);
  const suCo = DL.lay('suco').filter(function (sc) { return sc.khachId === k.id; })
    .sort(function (a, b) { return a.ngayGui < b.ngayGui ? 1 : -1; });
  const suCoChuaXong = suCo.filter(function (sc) { return sc.trangThai !== 'hoanthanh'; }).length;
  const thongBao = DL.lay('thongbao').slice().sort(function (a, b) { return a.ngayDang < b.ngayDang ? 1 : -1; });
  const ttHd = trangThaiHopDongKhach(hd);

  const chiTietMoiNhat = moiNhat
    ? '<div class="the" style="margin-bottom:18px">' +
        '<div class="the__dau"><div><h3>Hóa đơn gần nhất</h3><p>Kỳ ' + kyDep(moiNhat.ky) + ' · ' + thoat(moiNhat.ma) + '</p></div>' + nhanHoaDon(moiNhat) + '</div>' +
        '<div class="khoi-tien" style="margin-top:0">' +
          '<div class="dong-tien"><span>Tổng tiền</span><b>' + tien(moiNhat.tong) + '</b></div>' +
          '<div class="dong-tien"><span>Đã thanh toán</span><b>' + tien(DL.daThu(moiNhat.id)) + '</b></div>' +
          '<div class="dong-tien"><span>Còn lại</span><b>' + tien(DL.conNo(moiNhat)) + '</b></div>' +
          '<div class="dong-tien"><span>Hạn thanh toán</span><b>' + ngay(moiNhat.han) + '</b></div>' +
        '</div>' +
        '<div style="margin-top:16px"><button class="nut nut--ngoc" data-xem-hd="' + moiNhat.id + '">Xem chi tiết hóa đơn</button></div>' +
      '</div>'
    : '<div class="the" style="margin-bottom:18px"><div class="the__dau"><div><h3>Hóa đơn</h3><p>Chưa có hóa đơn nào</p></div></div>' +
      '<p class="chu-mo" style="font-size:14px">Hóa đơn sẽ xuất hiện sau khi chủ trọ lập cho phòng của bạn.</p></div>';

  const dsSuCo = suCo.slice(0, 3);
  const theSuCo = '<div class="the">' +
    '<div class="the__dau"><div><h3>Sự cố gần đây</h3><p>' + suCoChuaXong + ' sự cố chưa hoàn thành</p></div>' +
      '<button class="nut nut--ngoc nut--nho" data-di="suco">Xem tất cả</button></div>' +
    (dsSuCo.length
      ? '<div class="ds-thanh-toan">' + dsSuCo.map(function (sc) {
          return '<div class="dong-thanh-toan"><span>' + thoat(sc.tieuDe) + '<br><span class="phu">' + ngayGio(sc.ngayGui) + '</span></span>' +
            '<span>' + nhanSuco(sc) + '</span></div>';
        }).join('') + '</div>'
      : '<p class="chu-mo" style="font-size:14px">Bạn chưa gửi sự cố nào.</p>') +
    '</div>';

  const theThongBao = '<div class="the" style="margin-bottom:18px">' +
    '<div class="the__dau"><div><h3>Thông báo mới</h3><p>Từ nhà trọ</p></div>' +
      '<button class="nut nut--ngoc nut--nho" data-di="thongbao">Tất cả</button></div>' +
    (thongBao.length
      ? thongBao.slice(0, 2).map(function (tb) {
          return '<div style="padding:12px 0;border-top:1px solid var(--vien-mem)">' +
            '<p style="font-size:14px;font-weight:600">' + thoat(tb.tieuDe) + '</p>' +
            '<p class="phu" style="margin-top:2px">' + ngay(tb.ngayDang) + '</p>' +
            '<p style="font-size:13px;color:var(--muc-48);margin-top:6px">' + thoat(tb.noiDung).slice(0, 120) + (tb.noiDung.length > 120 ? '…' : '') + '</p>' +
          '</div>';
        }).join('')
      : '<p class="chu-mo" style="font-size:14px">Chưa có thông báo.</p>') +
    '</div>';

  const theCaNhan = '<div class="the">' +
    '<div class="the__dau"><div><h3>Thông tin của bạn</h3></div>' +
      '<button class="nut nut--ngoc nut--nho" data-di="canhan">Chi tiết</button></div>' +
    danhSachMoTa([
      ['Họ tên', thoat(k.hoTen)],
      ['Số điện thoại', thoat(k.sdt)],
      ['CCCD', thoat(k.cccd)],
      ['Email', thoat(k.email)],
      ['Phòng', thoat(p.ma) + ' · ' + thoat(p.ten)],
      ['Trạng thái hồ sơ', k.trangThai === 'dangthue' ? 'Đang thuê' : 'Đã rời đi']
    ]) +
    '</div>';

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Xin chào, ' + thoat(k.hoTen), 'Phòng ' + thoat(p.ma) + ' · ' + thoat(p.ten) + ' · Tầng ' + thoat(p.tang) + '.') +
      luoiThongKe([
        { nhan: 'Phòng đang ở', so: thoat(p.ma), ghiChu: thoat(p.dienTich) + ' m² · ' + tien(hd.tienThue) + '/tháng' },
        { nhan: 'Công nợ hiện tại', so: tien(congNo), lop: congNo > 0 ? 'thong-ke__so--do' : 'thong-ke__so--la', ghiChu: dsHd.length + ' hóa đơn' },
        { nhan: 'Hợp đồng', so: nhan(ttHd.chu, ttHd.loai), ghiChu: 'Hết hạn ' + ngay(hd.ngayKetThuc) },
        { nhan: 'Sự cố chưa xong', so: suCoChuaXong, lop: suCoChuaXong ? 'thong-ke__so--do' : '' }
      ]) +
      '<div class="luoi luoi--2-1" style="margin-top:8px">' +
        '<div>' + chiTietMoiNhat + theSuCo + '</div>' +
        '<div>' + theThongBao + theCaNhan + '</div>' +
      '</div>' +
    '</div>';

  khu.onclick = function (e) {
    const di = e.target.closest('[data-di]');
    const xem = e.target.closest('[data-xem-hd]');
    if (di) { e.preventDefault(); chuyenManHinh(di.dataset.di); }
    if (xem) moHoaDonKhach(DL.tim('hoadon', xem.dataset.xemHd), k);
  };
}

/* ============================================================
   HÓA ĐƠN
   ============================================================ */

function manKhachHoaDon() {
  const k = layKhachHienTai();
  if (!k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Vui lòng liên hệ chủ trọ để được liên kết hồ sơ khách thuê.');

  const ds = hoaDonCuaKhach(k).sort(function (a, b) { return a.ky < b.ky ? 1 : -1; });
  const tongNo = ds.reduce(function (t, h) { return t + DL.conNo(h); }, 0);

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Hóa đơn', 'Chỉ hiển thị hóa đơn của bạn. Hóa đơn đã hủy không được hiển thị.') +
      luoiThongKe([
        { nhan: 'Số hóa đơn', so: ds.length },
        { nhan: 'Tổng còn nợ', so: tien(tongNo), lop: tongNo > 0 ? 'thong-ke__so--do' : 'thong-ke__so--la' }
      ]) +
      (ds.length
        ? '<div class="toolbar"><div class="toolbar__trai">' +
            oTim('timHoaDonKhach', 'Tìm mã hóa đơn hoặc kỳ…') +
            '<select id="locHoaDonKhach" class="o-loc" aria-label="Lọc trạng thái hóa đơn">' +
              '<option value="tatca">Mọi trạng thái</option>' +
              '<option value="qua-han">Quá hạn</option>' +
              '<option value="moi">Chưa thanh toán</option>' +
              '<option value="mot-phan">Thanh toán một phần</option>' +
              '<option value="xong">Đã thanh toán</option>' +
            '</select>' +
          '</div><span class="dem" id="demHoaDonKhach"></span></div>' +
          '<div id="danhSachHoaDonKhach"></div>'
        : trangTrong('Chưa có hóa đơn', 'Hóa đơn sẽ xuất hiện sau khi chủ trọ lập cho phòng của bạn.')) +
    '</div>';

  function veDanhSachHoaDon() {
    const tim = giaTri('timHoaDonKhach').toLowerCase();
    const loc = giaTri('locHoaDonKhach');
    const ketQua = ds.filter(function (h) {
      const tt = DL.trangThaiHoaDon(h);
      const khopTrangThai = loc === 'tatca' || tt.loai === loc;
      const khopTim = !tim || [h.ma, h.ky, kyDep(h.ky)].join(' ').toLowerCase().indexOf(tim) >= 0;
      return khopTrangThai && khopTim;
    });
    document.getElementById('danhSachHoaDonKhach').innerHTML = bangHtml(
      ['Mã', 'Kỳ', 'Tổng', 'Đã trả', 'Còn lại', 'Hạn', 'Trạng thái', ''],
      ketQua.map(function (h) {
        const tt = DL.trangThaiHoaDon(h);
        return [
          '<strong>' + thoat(h.ma) + '</strong>',
          kyDep(h.ky),
          '<span class="so">' + tien(h.tong) + '</span>',
          '<span class="so">' + tien(tt.daThu) + '</span>',
          '<span class="so">' + tien(tt.con) + '</span>',
          ngay(h.han),
          nhanHoaDon(h),
          '<button class="nut nut--ngoc nut--nho" data-xem="' + thoat(h.id) + '">Chi tiết</button>'
        ];
      })
    );
    document.getElementById('demHoaDonKhach').textContent = ketQua.length + ' / ' + ds.length + ' hóa đơn';
  }

  if (ds.length) {
    veDanhSachHoaDon();
    ganTim('timHoaDonKhach', veDanhSachHoaDon);
    document.getElementById('locHoaDonKhach').onchange = veDanhSachHoaDon;
  }

  khu.onclick = function (e) {
    const b = e.target.closest('[data-xem]');
    if (b) moHoaDonKhach(DL.tim('hoadon', b.dataset.xem), k);
  };
}

/* Chi tiết hóa đơn + thông tin chuyển khoản */
function moHoaDonKhach(hd, k) {
  if (!hd || hd.khachId !== k.id) { thongBao('Bạn không có quyền xem hóa đơn này.', 'loi'); return; }
  const p = DL.tim('phong', hd.phongId);
  const hdThue = hopDongCuaKhachHienTai(k);
  const tt = DL.trangThaiHoaDon(hd);
  const dsThanhToan = DL.lay('thanhtoan').filter(function (t) { return t.hoaDonId === hd.id; });
  const noiDungCk = hd.ma + ' ' + (p ? p.ma : '') + ' ' + k.hoTen;

  const phanChuyenKhoan = (tt.con > 0 && hdThue)
    ? '<div class="vach"></div>' +
      '<h3 style="font-size:14px;font-family:var(--font-chu);margin-bottom:10px">Thông tin chuyển khoản</h3>' +
      '<div class="khoi-tien" style="margin-top:0">' +
        '<div class="dong-tien"><span>Số tiền cần chuyển</span><b>' + tien(tt.con) + '</b></div>' +
        '<div class="dong-tien"><span>Tài khoản nhận</span><b>' + thoat(hdThue.taiKhoanNhan || 'Liên hệ chủ trọ') + '</b></div>' +
        '<div class="dong-tien"><span>Nội dung chuyển khoản</span><b><code>' + thoat(noiDungCk) + '</code></b></div>' +
      '</div>' +
      '<div style="margin-top:12px"><button class="nut nut--ngoc nut--nho" id="copyNoiDungCk">Sao chép nội dung chuyển khoản</button></div>' +
      '<p class="ghi-chu-nho">Sau khi chuyển khoản, vui lòng báo chủ trọ hoặc quản lý. Hệ thống không tự tạo giao dịch.</p>'
    : '';

  const lop = moHop({
    tieuDe: 'Hóa đơn ' + thoat(hd.ma),
    moTa: 'Kỳ ' + kyDep(hd.ky) + (p ? ' · ' + thoat(p.ma) : '') + ' · Hạn ' + ngay(hd.han),
    noiDung:
      '<div style="margin-bottom:12px">' + nhanHoaDon(hd) + '</div>' +
      '<div class="khoi-tien" style="margin-top:0">' +
        '<div class="dong-tien"><span>Tiền phòng</span><b>' + tien(hd.tienPhong) + '</b></div>' +
        '<div class="dong-tien"><span>Điện · ' + thoat(hd.soDien) + ' kWh × ' + tien(hd.giaDien) + '</span><b>' + tien(hd.tienDien) + '</b></div>' +
        '<div class="dong-tien"><span>Nước · ' + thoat(hd.soNuoc) + ' m³ × ' + tien(hd.giaNuoc) + '</span><b>' + tien(hd.tienNuoc) + '</b></div>' +
        '<div class="dong-tien"><span>Phí dịch vụ</span><b>' + tien(hd.phiDichVu) + '</b></div>' +
        '<div class="dong-tien dong-tien--tong"><span>Tổng cộng</span><b>' + tien(hd.tong) + '</b></div>' +
        '<div class="dong-tien"><span>Đã thanh toán</span><b>' + tien(tt.daThu) + '</b></div>' +
        '<div class="dong-tien' + (tt.con > 0 ? ' dong-tien--no' : '') + '"><span>Còn lại</span><b>' + tien(tt.con) + '</b></div>' +
      '</div>' +
      (dsThanhToan.length
        ? '<div class="vach"></div><h3 style="font-size:14px;font-family:var(--font-chu);margin-bottom:10px">Các lần thanh toán</h3>' +
          '<div class="ds-thanh-toan">' + dsThanhToan.map(function (t) {
            return '<div class="dong-thanh-toan"><span>' + ngay(t.ngay) + ' · ' + thoat(t.phuongThuc) + '</span><b>' + tien(t.soTien) + '</b></div>';
          }).join('') + '</div>'
        : '') +
      phanChuyenKhoan,
    chanTrang: '<button class="nut nut--chinh" data-dong>Đóng</button>'
  });

  const nutChep = document.getElementById('copyNoiDungCk');
  if (nutChep) nutChep.onclick = function () { saoChep(noiDungCk); };
}

/* ============================================================
   HỢP ĐỒNG
   ============================================================ */

function manKhachHopDong() {
  const k = layKhachHienTai();
  if (!k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Vui lòng liên hệ chủ trọ để được liên kết hồ sơ khách thuê.');

  const hd = hopDongCuaKhachHienTai(k);
  const khu = document.getElementById('noidung');

  if (!hd) {
    khu.innerHTML = '<div class="man">' + dauMan('Hợp đồng thuê', 'Thông tin hợp đồng hiện tại của bạn.') +
      '<div style="margin-top:24px">' + trangTrong('Chưa có hợp đồng', 'Vui lòng chờ chủ trọ lập hợp đồng thuê cho phòng của bạn.') + '</div></div>';
    return;
  }

  const p = DL.tim('phong', hd.phongId);
  const tt = trangThaiHopDongKhach(hd);

  khu.innerHTML =
    '<div class="man">' +
      '<div class="man__dau"><div><h1>Hợp đồng thuê</h1>' +
        '<p class="mo-ta">' + thoat(hd.ma) + ' · ' + (p ? thoat(p.ma) + ' · ' + thoat(p.ten) : '') + ' · ' + nhan(tt.chu, tt.loai) + '</p></div>' +
        '<div class="man__nut"><button class="nut nut--ngoc" id="inHopDongKhach">In hợp đồng</button></div></div>' +
      luoiThongKe([
        { nhan: 'Ngày bắt đầu', so: ngay(hd.ngayBatDau) },
        { nhan: 'Ngày hết hạn', so: ngay(hd.ngayKetThuc), ghiChu: tt.chu },
        { nhan: 'Tiền thuê', so: tien(hd.tienThue), ghiChu: 'mỗi tháng' },
        { nhan: 'Tiền cọc', so: tien(hd.tienCoc) }
      ]) +
      '<div class="luoi luoi--2">' +
        '<div class="the"><div class="the__dau"><h3>Thông tin thuê</h3></div>' +
          danhSachMoTa([
            ['Địa chỉ nhà trọ', thoat(hd.diaChiChuNha)],
            ['Phòng', p ? thoat(p.ma) + ' — ' + thoat(p.ten) : '—'],
            ['Mục đích thuê', thoat(hd.mucDich)],
            ['Chủ nhà', thoat(hd.chuNha)],
            ['Điện thoại chủ nhà', thoat(hd.sdtChuNha)],
            ['Người thuê', thoat(k.hoTen)],
            ['Người ở cùng', thoat(hd.nguoiOCung)],
            ['Số người tối đa', thoat(hd.soNguoiToiDa)]
          ]) +
        '</div>' +
        '<div class="the"><div class="the__dau"><h3>Thanh toán</h3></div>' +
          danhSachMoTa([
            ['Hạn thanh toán', 'Ngày ' + thoat(hd.hanThanhToan) + ' hằng tháng'],
            ['Phương thức', thoat(hd.phuongThuc)],
            ['Tài khoản nhận tiền', thoat(hd.taiKhoanNhan)],
            ['Giá điện', tien(hd.giaDien) + ' / kWh'],
            ['Giá nước', tien(hd.giaNuoc) + ' / m³'],
            ['Phí dịch vụ', tien(hd.phiDichVu) + ' / tháng']
          ]) +
        '</div>' +
      '</div>' +
      '<div class="the" style="margin-top:18px"><div class="the__dau"><h3>Bàn giao và điều khoản</h3></div>' +
        danhSachMoTa([
          ['Ngày bàn giao', ngay(hd.ngayBanGiao)],
          ['Hiện trạng / thiết bị', thoat(hd.hienTrang)],
          ['Chỉ số bàn giao', thoat(hd.chiSoBanGiao)],
          ['Quyền và nghĩa vụ', thoat(hd.dieuKhoan)],
          ['Báo trước khi chấm dứt', thoat(hd.soNgayBaoTruoc) + ' ngày'],
          ['Hoàn cọc trong', thoat(hd.soNgayHoanCoc) + ' ngày'],
          ['Điều kiện chấm dứt sớm', thoat(hd.dieuKienChamDut)],
          ['Khấu trừ cọc', thoat(hd.khauTruCoc)],
          ['Xử lý trễ hạn', thoat(hd.xuLyTreHan)],
          ['Giải quyết tranh chấp', thoat(hd.tranhChap)],
          ['Thỏa thuận bổ sung', thoat(hd.boSung)],
          ['Ngày ký', ngay(hd.ngayKy)]
        ]) +
      '</div>' +
      '<p class="ghi-chu-nho">Nếu cần thay đổi thông tin hợp đồng, vui lòng liên hệ chủ trọ hoặc quản lý.</p>' +
    '</div>';

  document.getElementById('inHopDongKhach').onclick = function () { inHopDong(hd); };
}

/* ============================================================
   CHỈ SỐ ĐIỆN NƯỚC
   ============================================================ */

function manKhachChiSo() {
  const k = layKhachHienTai();
  if (!k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Vui lòng liên hệ chủ trọ để được liên kết hồ sơ khách thuê.');

  const hd = hopDongCuaKhachHienTai(k);
  const khu = document.getElementById('noidung');
  if (!hd) {
    khu.innerHTML = '<div class="man">' + dauMan('Chỉ số điện nước', 'Chỉ số của phòng bạn theo từng kỳ.') +
      '<div style="margin-top:24px">' + trangTrong('Đang chờ xếp phòng', 'Bạn cần có hợp đồng hiệu lực để xem chỉ số điện nước.') + '</div></div>';
    return;
  }

  const p = DL.tim('phong', hd.phongId);
  const ds = DL.lay('chiso').filter(function (c) {
    return c.phongId === hd.phongId && c.ky >= hd.ngayBatDau.slice(0, 7);
  }).sort(function (a, b) { return a.ky < b.ky ? 1 : -1; });

  const dong = ds.map(function (c) {
    return [
      kyDep(c.ky),
      '<span class="so">' + c.dienDau + '</span>',
      '<span class="so">' + c.dienCuoi + '</span>',
      '<span class="so"><b>' + Math.max(0, c.dienCuoi - c.dienDau) + '</b> kWh</span>',
      '<span class="so">' + c.nuocDau + '</span>',
      '<span class="so">' + c.nuocCuoi + '</span>',
      '<span class="so"><b>' + Math.max(0, c.nuocCuoi - c.nuocDau) + '</b> m³</span>',
      ngay(c.ngayChot)
    ];
  });

  khu.innerHTML =
    '<div class="man">' +
      dauMan('Chỉ số điện nước', 'Chỉ số của phòng ' + thoat(p ? p.ma : '') + ', mới nhất trước.')
      + (ds.length
        ? bangHtml(['Kỳ', 'Điện đầu', 'Điện cuối', 'Tiêu thụ', 'Nước đầu', 'Nước cuối', 'Tiêu thụ', 'Ngày chốt'], dong)
        : trangTrong('Chưa có chỉ số', 'Vui lòng chờ chủ trọ ghi nhận chỉ số điện nước cho phòng của bạn.')) +
    '</div>';
}

/* ============================================================
   THÔNG BÁO
   ============================================================ */

function manKhachThongBao() {
  const k = layKhachHienTai();
  if (!k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Vui lòng liên hệ chủ trọ để được liên kết hồ sơ khách thuê.');

  const ds = DL.lay('thongbao').slice().sort(function (a, b) { return a.ngayDang < b.ngayDang ? 1 : -1; });
  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Thông báo', 'Thông báo chung từ nhà trọ, mới nhất trước.') +
      '<div style="margin-top:24px">' +
        (ds.length
          ? ds.map(function (tb) {
              return '<div class="the" style="margin-bottom:14px">' +
                '<div class="the__dau"><div><h3>' + thoat(tb.tieuDe) + '</h3><p>' + ngay(tb.ngayDang) + '</p></div></div>' +
                '<p style="font-size:15px;color:var(--muc-80);white-space:pre-line">' + thoat(tb.noiDung) + '</p>' +
              '</div>';
            }).join('')
          : trangTrong('Chưa có thông báo', 'Nhà trọ chưa đăng thông báo nào.')) +
      '</div>' +
    '</div>';
}

/* ============================================================
   BÁO SỰ CỐ
   ============================================================ */

function manKhachSuCo() {
  const k = layKhachHienTai();
  if (!k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Vui lòng liên hệ chủ trọ để được liên kết hồ sơ khách thuê.');

  const hd = hopDongCuaKhachHienTai(k);
  const p = hd ? DL.tim('phong', hd.phongId) : null;
  const ds = DL.lay('suco').filter(function (sc) { return sc.khachId === k.id; })
    .sort(function (a, b) { return a.ngayGui < b.ngayGui ? 1 : -1; });

  const dong = ds.map(function (sc) {
    return [
      '<strong>' + thoat(sc.ma) + '</strong>',
      '<div>' + thoat(sc.tieuDe) + '</div><div class="phu">' + thoat(sc.phanLoai) + '</div>',
      nhanMucDo(sc.mucDo),
      ngayGio(sc.ngayGui),
      nhanSuco(sc),
      '<button class="nut nut--ngoc nut--nho" data-xem-su-co="' + thoat(sc.id) + '">Chi tiết</button>'
    ];
  });

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Báo sự cố', 'Gửi sự cố cho phòng của bạn và theo dõi tiến độ xử lý.') +
      '<div class="' + (p ? 'luoi luoi--1-2' : '') + '" style="margin-top:24px">' +
        (p
          ? '<div class="the">' +
              '<div class="the__dau"><div><h3>Gửi sự cố mới</h3><p>Phòng ' + thoat(p.ma) + ' · ' + thoat(k.hoTen) + '</p></div></div>' +
              '<form class="bieu-mau" id="formBaoSuCo">' +
                '<div class="nhom"><label for="ksTieuDe">Tiêu đề *</label><input id="ksTieuDe" class="o-nhap" maxlength="120" required placeholder="Tối đa 120 ký tự"></div>' +
                '<div class="luoi-nhap">' +
                  '<div class="nhom"><label for="ksPhanLoai">Phân loại</label><select id="ksPhanLoai" class="o-chon">' +
                    '<option>Điện</option><option>Nước</option><option>Cơ sở vật chất</option><option>Vệ sinh</option><option>An ninh</option><option>Khác</option>' +
                  '</select></div>' +
                  '<div class="nhom"><label for="ksMucDo">Mức độ</label><select id="ksMucDo" class="o-chon">' +
                    '<option>Thấp</option><option selected>Trung bình</option><option>Cao</option></select></div>' +
                '</div>' +
                '<div class="nhom"><label for="ksMoTa">Mô tả</label><textarea id="ksMoTa" class="o-vung" maxlength="1000" placeholder="Tối đa 1.000 ký tự"></textarea></div>' +
                '<div><button type="submit" class="nut nut--chinh" id="guiSuCo">Gửi sự cố</button></div>' +
              '</form>' +
            '</div>'
          : '') +
        '<div class="the">' +
          '<div class="the__dau"><div><h3>Lịch sử sự cố</h3><p>' + ds.length + ' phiếu đã gửi</p></div></div>' +
          (ds.length
            ? bangHtml(['Mã', 'Sự cố', 'Mức độ', 'Ngày gửi', 'Trạng thái', ''], dong, 6)
            : trangTrong('Chưa có sự cố', 'Khi cần hỗ trợ, hãy gửi phiếu đầu tiên cho chủ trọ.')) +
        '</div>' +
      '</div>' +
      (!p
        ? '<p class="ghi-chu-nho">Bạn không có hợp đồng đang hiệu lực nên chưa thể gửi sự cố mới. Lịch sử các phiếu đã gửi vẫn được giữ lại.</p>'
        : '') +
    '</div>';

  const form = document.getElementById('formBaoSuCo');
  if (form) form.onsubmit = function (e) {
    e.preventDefault();
    const tieuDe = giaTri('ksTieuDe');
    const moTa = giaTri('ksMoTa');
    if (!tieuDe) { thongBao('Vui lòng nhập tiêu đề sự cố.', 'loi'); return; }
    if (tieuDe.length > 120) { thongBao('Tiêu đề tối đa 120 ký tự.', 'loi'); return; }
    if (moTa.length > 1000) { thongBao('Mô tả tối đa 1.000 ký tự.', 'loi'); return; }
    const soTiepTheo = String(DL.lay('suco').length + 1).padStart(4, '0');
    const bayGio = new Date();
    const chuoiThoiGian = bayGio.getFullYear() + '-' + String(bayGio.getMonth() + 1).padStart(2, '0') + '-' +
      String(bayGio.getDate()).padStart(2, '0') + 'T' + String(bayGio.getHours()).padStart(2, '0') + ':' +
      String(bayGio.getMinutes()).padStart(2, '0');
    DL.them('suco', {
      ma: 'SC-' + soTiepTheo, phongId: p.id, khachId: k.id,
      tieuDe: tieuDe, phanLoai: giaTri('ksPhanLoai'), mucDo: giaTri('ksMucDo'),
      moTa: moTa, ngayGui: chuoiThoiGian, trangThai: 'moi',
      nguoiXuLy: '', chiPhi: 0, nguoiBao: k.hoTen, sdt: k.sdt
    });
    thongBao('Đã gửi sự cố. Chủ trọ sẽ sớm phản hồi.');
    manKhachSuCo();
  };

  khu.onclick = function (e) {
    const nutXem = e.target.closest('[data-xem-su-co]');
    if (nutXem) moChiTietSuCoKhach(DL.tim('suco', nutXem.dataset.xemSuCo), k);
  };
}

function moChiTietSuCoKhach(sc, k) {
  if (!sc || sc.khachId !== k.id) {
    thongBao('Bạn không có quyền xem sự cố này.', 'loi');
    return;
  }
  const p = DL.tim('phong', sc.phongId);
  moHop({
    tieuDe: 'Phiếu sự cố ' + thoat(sc.ma),
    moTa: ngayGio(sc.ngayGui) + (p ? ' · Phòng ' + thoat(p.ma) : ''),
    noiDung:
      '<div class="hang" style="gap:8px;margin-bottom:14px">' +
        nhanSuco(sc) + nhanMucDo(sc.mucDo) + '<span class="phu">' + thoat(sc.phanLoai || 'Khác') + '</span>' +
      '</div>' +
      '<h3 style="font-size:21px;letter-spacing:-0.2px;line-height:1.3">' + thoat(sc.tieuDe) + '</h3>' +
      '<p class="chu-mo" style="font-size:14px;margin-top:10px;line-height:1.6;white-space:pre-line">' +
        (sc.moTa ? thoat(sc.moTa) : 'Không có mô tả bổ sung.') +
      '</p>' +
      '<div class="vach"></div>' +
      danhSachMoTa([
        ['Phòng', p ? thoat(p.ma) + ' — ' + thoat(p.ten) : '—'],
        ['Người tiếp nhận', thoat(sc.nguoiXuLy) || 'Chưa cập nhật'],
        ['Chi phí phát sinh', Number(sc.chiPhi) > 0 ? tien(sc.chiPhi) : 'Chưa phát sinh / chưa cập nhật']
      ]),
    chanTrang: '<button class="nut nut--chinh" data-dong>Đóng</button>'
  });
}

/* ============================================================
   THÀNH VIÊN Ở CÙNG
   ============================================================ */

function manKhachThanhVien() {
  const k = layKhachHienTai();
  if (!k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Vui lòng liên hệ chủ trọ để được liên kết hồ sơ khách thuê.');

  const hd = hopDongCuaKhachHienTai(k);
  const khu = document.getElementById('noidung');
  if (!hd) {
    khu.innerHTML = '<div class="man">' + dauMan('Thành viên ở cùng', 'Danh sách người ở cùng phòng của bạn.') +
      '<div style="margin-top:24px">' + trangTrong('Chưa có thông tin', 'Bạn cần có hợp đồng hiệu lực để xem thành viên ở cùng.') + '</div></div>';
    return;
  }

  const chuoi = (hd.nguoiOCung || '').trim();
  const dong = chuoi
    ? [[
        '1',
        thoat(chuoi),
        '<span class="phu">Theo hợp đồng</span>',
        '<span class="phu">—</span>',
        'Người ở cùng',
        nhan('Đang ở', 'xanh-la')
      ]]
    : [];

  khu.innerHTML =
    '<div class="man">' +
      dauMan('Thành viên ở cùng', 'Thông tin lấy từ mục “Người ở cùng” trong hợp đồng thuê.') +
      '<div style="margin-top:24px">' +
        (dong.length
          ? bangHtml(['STT', 'Họ tên / ghi chú', 'Số điện thoại', 'CCCD', 'Vai trò', 'Trạng thái'], dong)
          : trangTrong('Chưa có thành viên', 'Hợp đồng chưa ghi nhận người ở cùng.')) +
      '</div>' +
      '<p class="ghi-chu-nho">Mỗi phòng có một tài khoản cho khách đại diện. Người ở cùng không có tài khoản riêng. Muốn thay đổi danh sách, vui lòng liên hệ chủ trọ.</p>' +
    '</div>';
}

/* ============================================================
   THÔNG TIN CÁ NHÂN & ĐỔI MẬT KHẨU
   ============================================================ */

function manKhachCaNhan() {
  const nd = DL.phien();
  const k = layKhachHienTai();
  if (!nd || !k) return manChan('Tài khoản chưa liên kết hồ sơ', 'Vui lòng liên hệ chủ trọ để được liên kết hồ sơ khách thuê.');

  const hd = hopDongCuaKhachHienTai(k);
  const p = hd ? DL.tim('phong', hd.phongId) : (k.phongId ? DL.tim('phong', k.phongId) : null);

  const khu = document.getElementById('noidung');
  khu.innerHTML =
    '<div class="man">' +
      dauMan('Thông tin cá nhân', 'Cập nhật số điện thoại và địa chỉ liên hệ. Email, CCCD và thông tin thuê do chủ trọ quản lý.') +
      '<div class="luoi luoi--1-2" style="margin-top:24px">' +
        '<div class="the">' +
          '<div class="the__dau"><h3>Hồ sơ</h3></div>' +
          danhSachMoTa([
            ['Họ tên', thoat(k.hoTen)],
            ['Số điện thoại', thoat(k.sdt)],
            ['CCCD', thoat(k.cccd)],
            ['Email', thoat(k.email) || '—'],
            ['Tên đăng nhập', '<span class="ma-don">' + thoat(nd.tenDangNhap) + '</span>'],
            ['Phòng', p ? thoat(p.ma) + ' · ' + thoat(p.ten) : 'Chưa xếp phòng'],
            ['Trạng thái hồ sơ', k.trangThai === 'dangthue' ? 'Đang thuê' : 'Đã rời đi']
          ]) +
          '<div class="vach"></div>' +
          '<button class="nut nut--ngoc" id="khachDangXuat">Đăng xuất</button>' +
        '</div>' +
        '<div class="the">' +
          '<div class="the__dau"><div><h3>Cập nhật liên hệ</h3><p>Chỉ cập nhật thông tin liên hệ của hồ sơ này.</p></div></div>' +
          '<form class="bieu-mau" id="formLienHeKhach">' +
            '<div class="nhom"><label for="klSdt">Số điện thoại</label><input id="klSdt" type="tel" class="o-nhap" inputmode="tel" autocomplete="tel" maxlength="11" value="' + thoat(k.sdt || '') + '" placeholder="Ví dụ: 0901234567"></div>' +
            '<div class="nhom"><label for="klDiaChi">Địa chỉ liên hệ</label><input id="klDiaChi" class="o-nhap" autocomplete="street-address" maxlength="200" value="' + thoat(k.diaChi || '') + '"></div>' +
            '<div class="nhom"><label for="klQueQuan">Quê quán</label><input id="klQueQuan" class="o-nhap" maxlength="100" value="' + thoat(k.queQuan || '') + '"></div>' +
            '<p class="loi" id="loiLienHeKhach" hidden></p>' +
            '<div><button type="submit" class="nut nut--chinh" id="luuLienHeKhach">Lưu thông tin liên hệ</button></div>' +
          '</form>' +
        '</div>' +
        '<div class="the">' +
          '<div class="the__dau"><div><h3>Đổi mật khẩu</h3><p>Mật khẩu mới tối thiểu 8 ký tự.</p></div></div>' +
          '<form class="bieu-mau" id="formDoiMkKhach">' +
            '<div class="nhom"><label for="kmMoi">Mật khẩu mới</label><input id="kmMoi" type="password" class="o-nhap" autocomplete="new-password"></div>' +
            '<div class="nhom"><label for="kmLai">Nhập lại mật khẩu mới</label><input id="kmLai" type="password" class="o-nhap" autocomplete="new-password"></div>' +
            '<p class="loi" id="loiDoiMkKhach" hidden></p>' +
            '<div><button type="button" class="nut nut--chinh" id="luuDoiMkKhach">Cập nhật mật khẩu</button></div>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('formLienHeKhach').onsubmit = function (e) {
    e.preventDefault();
    const sdt = giaTri('klSdt');
    const diaChi = giaTri('klDiaChi');
    const queQuan = giaTri('klQueQuan');
    const loi = document.getElementById('loiLienHeKhach');
    loi.hidden = true;
    if (sdt && !/^0\d{9,10}$/.test(sdt)) {
      loi.hidden = false;
      loi.textContent = 'Số điện thoại cần có 10–11 chữ số và bắt đầu bằng số 0.';
      document.getElementById('klSdt').focus();
      return;
    }
    if (diaChi.length > 200 || queQuan.length > 100) {
      loi.hidden = false;
      loi.textContent = 'Địa chỉ tối đa 200 ký tự, quê quán tối đa 100 ký tự.';
      return;
    }
    const daCapNhat = DL.sua('khach', k.id, { sdt: sdt, diaChi: diaChi, queQuan: queQuan });
    if (!daCapNhat) {
      loi.hidden = false;
      loi.textContent = 'Không thể cập nhật hồ sơ. Vui lòng tải lại trang và thử lại.';
      return;
    }
    thongBao('Đã cập nhật thông tin liên hệ.');
    manKhachCaNhan();
  };

  document.getElementById('khachDangXuat').onclick = function () {
    hoi('Đăng xuất?', 'Bạn sẽ quay về trang giới thiệu.', 'Đăng xuất').then(function (dongY) {
      if (!dongY) return;
      DL.dangXuat().then(function () { location.href = '../index.html'; }).catch(function (loi) {
        console.error('Đăng xuất thất bại:', loi);
        thongBao('Không thể đăng xuất khỏi Supabase. Vui lòng thử lại.', 'loi');
      });
    });
  };

  document.getElementById('luuDoiMkKhach').onclick = function () {
    const moi = giaTri('kmMoi');
    const lai = giaTri('kmLai');
    const loi = document.getElementById('loiDoiMkKhach');
    function baoLoi(chu) { loi.hidden = false; loi.textContent = chu; }
    loi.hidden = true;
    if (moi.length < 8) return baoLoi('Mật khẩu mới phải có ít nhất 8 ký tự.');
    if (moi !== lai) return baoLoi('Hai lần nhập mật khẩu không khớp.');
    DL.doiMatKhau(nd.id, moi).then(function () {
      thongBao('Đã đổi mật khẩu thành công.');
      document.getElementById('formDoiMkKhach').reset();
    }).catch(function (loi) {
      console.error('Đổi mật khẩu thất bại:', loi);
      baoLoi('Không thể đổi mật khẩu. Vui lòng thử lại.');
    });
  };
}

/* ============================================================
   KHỞI ĐỘNG TRANG
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  DL.sanSang.then(function () {
    const nd = khoiTaoKhung({ vaiTro: 'khachthue', menu: MENU_KHACH, tenVaiTro: 'Khách thuê' });
    if (!nd) return;

    window.cacManHinh = {
      tongquan: manKhachTongQuan,
      hoadon: manKhachHoaDon,
      hopdong: manKhachHopDong,
      chiso: manKhachChiSo,
      thongbao: manKhachThongBao,
      suco: manKhachSuCo,
      thanhvien: manKhachThanhVien,
      canhan: manKhachCaNhan
    };

    window.addEventListener('hashchange', function () {
      const ten = location.hash.slice(1);
      if (window.cacManHinh[ten]) chuyenManHinh(ten);
    });

  /* Mở hóa đơn từ link được gửi */
  const thamSo = new URLSearchParams(location.search);
  const idHoaDon = thamSo.get('hoadon');
  const k = layKhachHienTai();

    if (idHoaDon) {
    const hd = DL.tim('hoadon', idHoaDon);
    if (!k) {
      manChan('Cần đăng nhập', 'Vui lòng đăng nhập bằng tài khoản khách thuê để mở hóa đơn.');
      return;
    }
    if (!hd || hd.khachId !== k.id) {
      thongBao('Bạn không có quyền mở hóa đơn này.', 'loi');
      chuyenManHinh('hoadon');
      return;
    }
    DL.sua('hoadon', hd.id, { luotMo: (Number(hd.luotMo) || 0) + 1 });
    chuyenManHinh('hoadon');
    moHoaDonKhach(hd, k);
    history.replaceState(null, '', 'khachthue.html#hoadon');
      return;
    }

    const dau = (location.hash || '#tongquan').slice(1);
    chuyenManHinh(window.cacManHinh[dau] ? dau : 'tongquan');
  }).catch(function (loi) {
    console.error('Khởi tạo dashboard Supabase thất bại:', loi);
    const khu = document.getElementById('noidung');
    if (khu) khu.innerHTML = '<div class="man"><p class="loi">Không thể tải dữ liệu từ Supabase. Tải lại trang để thử lại.</p></div>';
  });
});

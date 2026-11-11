/* ============================================================
   trangchu.js — Trang giới thiệu: hiển thị phòng trống, bảng giá
   dịch vụ và điều chỉnh lối vào hệ thống theo phiên đăng nhập.
   Chỉ dùng dữ liệu trong localStorage, không gọi mạng.
   ============================================================ */

/* Chống chèn HTML lạ vào nội dung lấy từ dữ liệu */
function thoatHtml(chu) {
  return String(chu == null ? '' : chu).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Định dạng tiền theo kiểu Việt Nam: 3.500.000 ₫ */
function dinhDangTien(soTien) {
  return (Number(soTien) || 0).toLocaleString('vi-VN') + ' ₫';
}

/* Đường dẫn trang theo vai trò đang đăng nhập */
function trangTheoVaiTro(vaiTro) {
  if (vaiTro === 'admin') return 'html/admin.html';
  if (vaiTro === 'quanly') return 'html/quanly.html';
  if (vaiTro === 'khachthue') return 'html/khachthue.html';
  return 'html/dangnhap.html';
}

/* Cập nhật con số tổng quan ở phần mở đầu */
function capNhatThongKe(phong) {
  const soTrong = phong.filter(function (p) { return p.trangThai === 'trong'; }).length;
  const oTong = document.querySelectorAll('[data-dem="tong-phong"]');
  const oTrong = document.querySelectorAll('[data-dem="phong-trong"]');
  oTong.forEach(function (o) { o.textContent = String(phong.length).padStart(2, '0'); });
  oTrong.forEach(function (o) { o.textContent = String(soTrong).padStart(2, '0'); });
}

/* Vẽ danh sách phòng còn trống thành các thẻ */
function vePhongTrong() {
  const khu = document.getElementById('danhSachPhongTrong');
  if (!khu) return;

  const ds = DL.lay('phong').filter(function (p) { return p.trangThai === 'trong'; });
  const soPhong = document.getElementById('soPhongTrong');
  if (soPhong) soPhong.textContent = ds.length;

  if (!ds.length) {
    khu.innerHTML = '<div class="the-trong-toi">Hiện tại các phòng đã kín chỗ. ' +
      'Vui lòng liên hệ nhà trọ để được ghi danh chờ phòng trống.</div>';
    return;
  }

  const phien = DL.phien();
  const diemDen = phien && phien.vaiTro === 'khachthue'
    ? 'html/khachthue.html'
    : 'html/dangnhap.html?tiep=khachthue.html';

  khu.innerHTML = ds.map(function (p) {
    const khuVuc = [p.khuVuc, p.tang ? 'Tầng ' + p.tang : '', p.dienTich ? p.dienTich + ' m²' : '']
      .filter(Boolean).join(' · ');
    const ghiChu = p.ghiChu
      ? thoatHtml(p.ghiChu)
      : 'Sẵn sàng nhận phòng, có thể xem ngay hôm nay.';
    return '<article class="the-phong-trong">' +
      '<div class="the-phong-trong__dau">' +
        '<span class="the-phong-trong__ma">' + thoatHtml(p.ma) + '</span>' +
        '<span class="nhan nhan--xanh-la">Còn trống</span>' +
      '</div>' +
      '<h3>' + thoatHtml(p.ten) + '</h3>' +
      '<p class="the-phong-trong__khu">' + thoatHtml(khuVuc) + '</p>' +
      '<p class="the-phong-trong__mota">' + ghiChu + '</p>' +
      '<p class="the-phong-trong__gia">' + dinhDangTien(p.gia) + ' <span>/ tháng</span></p>' +
      '<a class="nut nut--ngoc nut--nho nut--toan" href="' + diemDen + '">Quan tâm phòng này</a>' +
    '</article>';
  }).join('');
}

/* Vẽ bảng giá dịch vụ đang áp dụng */
function veBangGia() {
  const khu = document.getElementById('bangGiaDichVu');
  if (!khu) return;

  const ds = DL.lay('dichvu');
  const dau = '<div class="the__dau"><div><h3>Bảng giá dịch vụ</h3>' +
    '<p>Đơn giá đang áp dụng tại An Cư</p></div></div>';

  if (!ds.length) {
    khu.innerHTML = dau + '<p class="ghi-chu-nho">Chưa có bảng giá dịch vụ.</p>';
    return;
  }

  const dong = ds.map(function (dv) {
    return '<div class="dong-dich-vu">' +
      '<span>' + thoatHtml(dv.ten) + '</span>' +
      '<b>' + dinhDangTien(dv.donGia) + ' / ' + thoatHtml(dv.donVi) + '</b>' +
    '</div>';
  }).join('');

  khu.innerHTML = dau + dong +
    '<p class="ghi-chu-nho">Giá có thể thay đổi theo hợp đồng. ' +
    'Hóa đơn chỉ tính trên sản lượng thực tế đã ghi nhận.</p>';
}

/* Đổi nhãn và đường dẫn nút đăng nhập nếu đang có phiên */
function capNhatLoiVao() {
  const phien = DL.phien();
  const nut = document.getElementById('nutDangNhap');
  if (!phien) return;

  const dich = trangTheoVaiTro(phien.vaiTro);
  if (nut) {
    nut.href = dich;
    nut.textContent = phien.vaiTro === 'khachthue' ? 'Trang của tôi' : 'Bảng điều khiển';
  }
  document.querySelectorAll('[data-vao-he-thong]').forEach(function (a) {
    a.href = dich;
  });
}

/* Ghi năm hiện tại vào chân trang */
function capNhatNam() {
  const o = document.getElementById('namHienTai');
  if (o) o.textContent = new Date().getFullYear();
}

/* Khởi động trang giới thiệu */
document.addEventListener('DOMContentLoaded', function () {
  try {
    const phong = DL.lay('phong');
    capNhatThongKe(phong);
    vePhongTrong();
    veBangGia();
    capNhatLoiVao();
    capNhatNam();
  } catch (e) {
    console.error('Không tải được trang giới thiệu:', e);
    const khu = document.getElementById('danhSachPhongTrong');
    if (khu) {
      khu.innerHTML = '<div class="the-trong-toi">Không tải được dữ liệu phòng. ' +
        'Vui lòng tải lại trang.</div>';
    }
  }
});

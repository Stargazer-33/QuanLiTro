document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('formDatLaiMatKhau');
  const thongBaoLoi = document.getElementById('thongBaoDatLai');
  const loi = document.getElementById('loiDatLaiMatKhau');

  function hienThongBao(chu) {
    thongBaoLoi.textContent = chu;
    thongBaoLoi.hidden = false;
  }

  DL.sanSang.then(function () {
    if (!DL.cheDoSupabase || !DL.phien()) {
      hienThongBao('Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu gửi lại email đặt mật khẩu.');
      return;
    }
    form.hidden = false;
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      loi.hidden = true;
      const matKhau = document.getElementById('matKhauMoi').value;
      const xacNhan = document.getElementById('xacNhanMatKhau').value;
      if (matKhau.length < 8) {
        loi.textContent = 'Mật khẩu mới cần có ít nhất 8 ký tự.';
        loi.hidden = false;
        return;
      }
      if (matKhau !== xacNhan) {
        loi.textContent = 'Hai lần nhập mật khẩu không khớp.';
        loi.hidden = false;
        return;
      }
      const nut = document.getElementById('nutCapNhatMatKhau');
      nut.disabled = true;
      try {
        await DL.capNhatMatKhauTuLienKet(matKhau);
        location.replace('dangnhap.html');
      } catch (error) {
        console.error('Cập nhật mật khẩu qua liên kết thất bại:', error);
        loi.textContent = 'Không thể cập nhật mật khẩu. Hãy yêu cầu gửi lại email đặt mật khẩu.';
        loi.hidden = false;
        nut.disabled = false;
      }
    });
  }).catch(function (error) {
    console.error('Khởi tạo trang đặt lại mật khẩu thất bại:', error);
    hienThongBao('Không thể kết nối Supabase. Vui lòng tải lại trang.');
  });
});

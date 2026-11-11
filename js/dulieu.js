/* ============================================================
   dulieu.js — Lớp dữ liệu của ứng dụng quản lý phòng trọ.
   Toàn bộ dữ liệu nằm trong localStorage của trình duyệt.
   Không có backend, không gọi mạng. Chỉ HTML/CSS/JS thuần.
   ============================================================ */

const KHOA_DB = 'ancu_db_v1';
const KHOA_PHIEN = 'ancu_phien_v1';
const KHOA_PHIEN_TAM = 'ancu_phien_tam_v1';

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
   Dữ liệu mẫu — đủ để chạy thử toàn bộ chức năng
   ------------------------------------------------------------ */
function duLieuMau() {
  const chuNha = {
    chuNha: 'Nguyễn Văn Chủ',
    cccdChuNha: '079080001111',
    sdtChuNha: '0909000111',
    diaChiChuNha: '18 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. HCM'
  };

  return {
    _phienBan: 1,

    phong: [
      { id: 'p101', ma: 'P101', ten: 'Phòng 101', tang: 1, khuVuc: 'Khu A', dienTich: 25, gia: 3500000, trangThai: 'dangthue', ghiChu: 'Ban công hướng Đông' },
      { id: 'p102', ma: 'P102', ten: 'Phòng 102', tang: 1, khuVuc: 'Khu A', dienTich: 25, gia: 3500000, trangThai: 'dangthue', ghiChu: 'Gần cầu thang' },
      { id: 'p103', ma: 'P103', ten: 'Phòng 103', tang: 1, khuVuc: 'Khu A', dienTich: 22, gia: 3200000, trangThai: 'trong', ghiChu: 'Mới sơn lại' },
      { id: 'p201', ma: 'P201', ten: 'Phòng 201', tang: 2, khuVuc: 'Khu A', dienTich: 30, gia: 4200000, trangThai: 'dangthue', ghiChu: 'Có cửa sổ lớn' },
      { id: 'p202', ma: 'P202', ten: 'Phòng 202', tang: 2, khuVuc: 'Khu A', dienTich: 30, gia: 4200000, trangThai: 'trong', ghiChu: '' },
      { id: 'p203', ma: 'P203', ten: 'Phòng 203', tang: 2, khuVuc: 'Khu A', dienTich: 28, gia: 3900000, trangThai: 'baotri', ghiChu: 'Đang sửa hệ thống điện' },
      { id: 'p301', ma: 'P301', ten: 'Phòng 301', tang: 3, khuVuc: 'Khu B', dienTich: 35, gia: 4800000, trangThai: 'dangthue', ghiChu: 'Có gác lửng' },
      { id: 'p302', ma: 'P302', ten: 'Phòng 302', tang: 3, khuVuc: 'Khu B', dienTich: 35, gia: 4800000, trangThai: 'trong', ghiChu: 'View sân thượng' }
    ],

    khach: [
      { id: 'k001', ma: 'K-001', hoTen: 'Nguyễn Văn An', sdt: '0901234567', cccd: '079201001234', email: 'an@ancu.vn', diaChi: '12 Lê Lợi, Quận 1, TP. HCM', queQuan: 'Quảng Nam', phongId: 'p101', ngayVao: '2025-01-01', trangThai: 'dangthue', ghiChu: '' },
      { id: 'k002', ma: 'K-002', hoTen: 'Trần Thị Bích', sdt: '0912345678', cccd: '079202002345', email: 'bich@ancu.vn', diaChi: '45 Hai Bà Trưng, Quận 3, TP. HCM', queQuan: 'Bình Định', phongId: 'p102', ngayVao: '2025-06-01', trangThai: 'dangthue', ghiChu: '' },
      { id: 'k003', ma: 'K-003', hoTen: 'Lê Minh Cường', sdt: '0923456789', cccd: '079203003456', email: '', diaChi: '88 Cách Mạng Tháng 8, Quận 10, TP. HCM', queQuan: 'Đà Nẵng', phongId: 'p201', ngayVao: '2025-11-01', trangThai: 'dangthue', ghiChu: 'Dùng SĐT làm tên đăng nhập' },
      { id: 'k004', ma: 'K-004', hoTen: 'Phạm Thu Hà', sdt: '0934567890', cccd: '079204004567', email: 'ha@ancu.vn', diaChi: '21 Nguyễn Thị Minh Khai, Quận 1, TP. HCM', queQuan: 'Huế', phongId: 'p301', ngayVao: '2026-01-10', trangThai: 'dangthue', ghiChu: '' },
      { id: 'k005', ma: 'K-005', hoTen: 'Vũ Đức Duy', sdt: '0945678901', cccd: '079205005678', email: '', diaChi: '301 Điện Biên Phủ, Quận 3, TP. HCM', queQuan: 'Nghệ An', phongId: '', ngayVao: '2024-08-01', trangThai: 'daroi', ghiChu: 'Đã trả phòng' },
      { id: 'k006', ma: 'K-006', hoTen: 'Ngô Thị Mai', sdt: '0956789012', cccd: '079206006789', email: 'mai@ancu.vn', diaChi: '9 Trần Hưng Đạo, Quận 5, TP. HCM', queQuan: 'Cần Thơ', phongId: '', ngayVao: '', trangThai: 'dangthue', ghiChu: 'Chờ xếp phòng' },
      { id: 'k007', ma: 'K-007', hoTen: 'Đỗ Văn Hùng', sdt: '0967890123', cccd: '079207007890', email: '', diaChi: '12 Lê Lợi, Quận 1, TP. HCM', queQuan: 'Thanh Hóa', phongId: '', ngayVao: '', trangThai: 'daroi', ghiChu: 'Người ở cùng phòng 101' }
    ],

    nhanvien: [
      { id: 'nv001', ma: 'NV-001', hoTen: 'Trần Quốc Bảo', sdt: '0909123456', email: 'quanly@ancu.vn', chucVu: 'Quản lý cơ sở', khuVuc: 'Khu A', ngayVao: '2024-02-01' },
      { id: 'nv002', ma: 'NV-002', hoTen: 'Lý Thị Hồng', sdt: '0918234567', email: 'hong@ancu.vn', chucVu: 'Kế toán', khuVuc: 'Toàn bộ', ngayVao: '2024-06-15' },
      { id: 'nv003', ma: 'NV-003', hoTen: 'Phan Văn Tú', sdt: '0927345678', email: 'tu@ancu.vn', chucVu: 'Kỹ thuật', khuVuc: 'Khu B', ngayVao: '2025-03-01' }
    ],

    nguoidung: [
      { id: 'u01', tenDangNhap: 'admin@ancu.vn', matKhau: '12345678', vaiTro: 'admin', hoTen: 'Nguyễn Văn Chủ', hoSoId: null, loaiHoSo: null, trangThai: 'hoatdong', phaiDoiMatKhau: false, ngayTao: '2024-01-01' },
      { id: 'u02', tenDangNhap: 'quanly@ancu.vn', matKhau: '12345678', vaiTro: 'quanly', hoTen: 'Trần Quốc Bảo', hoSoId: 'nv001', loaiHoSo: 'nhanvien', trangThai: 'hoatdong', phaiDoiMatKhau: false, ngayTao: '2024-02-01' },
      { id: 'u03', tenDangNhap: 'an@ancu.vn', matKhau: '12345678', vaiTro: 'khachthue', hoTen: 'Nguyễn Văn An', hoSoId: 'k001', loaiHoSo: 'khach', trangThai: 'hoatdong', phaiDoiMatKhau: false, ngayTao: '2025-01-01' },
      { id: 'u04', tenDangNhap: '0923456789@tenant.local', matKhau: 'Tam@864209', vaiTro: 'khachthue', hoTen: 'Lê Minh Cường', hoSoId: 'k003', loaiHoSo: 'khach', trangThai: 'hoatdong', phaiDoiMatKhau: true, ngayTao: '2025-11-01' },
      { id: 'u05', tenDangNhap: 'mai@ancu.vn', matKhau: '12345678', vaiTro: 'khachthue', hoTen: 'Ngô Thị Mai', hoSoId: 'k006', loaiHoSo: 'khach', trangThai: 'hoatdong', phaiDoiMatKhau: false, ngayTao: '2026-10-20' },
      { id: 'u06', tenDangNhap: 'bich@ancu.vn', matKhau: '12345678', vaiTro: 'khachthue', hoTen: 'Trần Thị Bích', hoSoId: 'k002', loaiHoSo: 'khach', trangThai: 'khoa', phaiDoiMatKhau: false, ngayTao: '2025-06-01' }
    ],

    hopdong: [
      {
        id: 'hd001', ma: 'HĐ-2025-001', phongId: 'p101', khachId: 'k001',
        ngayBatDau: '2025-01-01', ngayKetThuc: '2026-12-31', ngayKy: '2024-12-28',
        tienThue: 3500000, tienCoc: 7000000, hanThanhToan: 5,
        phuongThuc: 'Chuyển khoản', taiKhoanNhan: 'Vietcombank · 0123456789 · NGUYEN VAN CHU',
        giaDien: 3500, giaNuoc: 15000, phiDichVu: 100000,
        mucDich: 'Để ở lâu dài', soNguoiToiDa: 3,
        nguoiOCung: 'Đỗ Văn Hùng (anh trai) — 0967890123',
        ngayBanGiao: '2025-01-01',
        hienTrang: 'Sàn gạch men, tường sơn trắng, 1 máy lạnh, 1 nóng lạnh, 1 tủ quần áo, 2 chìa khóa.',
        chiSoBanGiao: 'Điện 1.200 kWh · Nước 300 m³',
        soNgayBaoTruoc: 30, soNgayHoanCoc: 15,
        dieuKhoan: 'Bên thuê thanh toán đúng hạn trước ngày 05 hằng tháng. Giữ gìn tài sản, không tự ý sửa chữa kết cấu. Báo trước 30 ngày khi chấm dứt hợp đồng.',
        dieuKienChamDut: 'Chấm dứt trước hạn khi bên thuê vi phạm nội quy 2 lần hoặc chậm thanh toán quá 15 ngày.',
        khauTruCoc: 'Khấu trừ chi phí sửa chữa hư hỏng do bên thuê gây ra và tiền điện nước còn nợ.',
        xuLyTreHan: 'Quá hạn 05 ngày tính phí 0,1%/ngày trên số tiền chậm.',
        tranhChap: 'Ưu tiên thương lượng; nếu không thống nhất thì giải quyết tại Tòa án nhân dân có thẩm quyền.',
        boSung: 'Được nuôi thú cưng nhỏ, giữ vệ sinh chung.',
        ...chuNha, trangThai: 'hieuluc'
      },
      {
        id: 'hd002', ma: 'HĐ-2025-002', phongId: 'p102', khachId: 'k002',
        ngayBatDau: '2025-06-01', ngayKetThuc: '2027-05-31', ngayKy: '2025-05-28',
        tienThue: 3500000, tienCoc: 7000000, hanThanhToan: 10,
        phuongThuc: 'Chuyển khoản', taiKhoanNhan: 'Vietcombank · 0123456789 · NGUYEN VAN CHU',
        giaDien: 3500, giaNuoc: 15000, phiDichVu: 100000,
        mucDich: 'Để ở', soNguoiToiDa: 2,
        nguoiOCung: '',
        ngayBanGiao: '2025-06-01',
        hienTrang: 'Sàn gạch, tường sơn, 1 máy lạnh, 1 tủ lạnh nhỏ, 2 chìa khóa.',
        chiSoBanGiao: 'Điện 860 kWh · Nước 210 m³',
        soNgayBaoTruoc: 30, soNgayHoanCoc: 15,
        dieuKhoan: 'Thanh toán trước ngày 10 hằng tháng. Giữ trật tự, không gây ồn sau 22 giờ.',
        dieuKienChamDut: 'Chấm dứt trước hạn khi vi phạm nội quy hoặc chậm thanh toán quá 15 ngày.',
        khauTruCoc: 'Khấu trừ hư hỏng tài sản và công nợ điện nước.',
        xuLyTreHan: 'Phí chậm thanh toán 0,1%/ngày.',
        tranhChap: 'Thương lượng trước, sau đó giải quyết theo pháp luật.',
        boSung: '',
        ...chuNha, trangThai: 'hieuluc'
      },
      {
        id: 'hd003', ma: 'HĐ-2025-003', phongId: 'p201', khachId: 'k003',
        ngayBatDau: '2025-11-01', ngayKetThuc: '2026-11-05', ngayKy: '2025-10-30',
        tienThue: 4200000, tienCoc: 8400000, hanThanhToan: 5,
        phuongThuc: 'Tiền mặt', taiKhoanNhan: 'Nhận tại văn phòng',
        giaDien: 3500, giaNuoc: 15000, phiDichVu: 120000,
        mucDich: 'Để ở', soNguoiToiDa: 3,
        nguoiOCung: '',
        ngayBanGiao: '2025-11-01',
        hienTrang: 'Sàn gạch, 1 máy lạnh, 1 nóng lạnh, cửa sổ lớn, 2 chìa khóa.',
        chiSoBanGiao: 'Điện 1.500 kWh · Nước 400 m³',
        soNgayBaoTruoc: 30, soNgayHoanCoc: 15,
        dieuKhoan: 'Thanh toán trước ngày 05 hằng tháng bằng tiền mặt tại văn phòng.',
        dieuKienChamDut: 'Chấm dứt trước hạn khi chậm thanh toán quá 15 ngày.',
        khauTruCoc: 'Khấu trừ công nợ và hư hỏng tài sản.',
        xuLyTreHan: 'Nhắc nhở và tính phí 0,1%/ngày.',
        tranhChap: 'Thương lượng, sau đó theo quy định pháp luật.',
        boSung: '',
        ...chuNha, trangThai: 'hieuluc'
      },
      {
        id: 'hd004', ma: 'HĐ-2026-004', phongId: 'p301', khachId: 'k004',
        ngayBatDau: '2026-01-10', ngayKetThuc: '2027-01-09', ngayKy: '2026-01-05',
        tienThue: 4800000, tienCoc: 9600000, hanThanhToan: 28,
        phuongThuc: 'Chuyển khoản', taiKhoanNhan: 'Techcombank · 19001234567 · NGUYEN VAN CHU',
        giaDien: 3500, giaNuoc: 15000, phiDichVu: 150000,
        mucDich: 'Để ở và làm việc tại nhà', soNguoiToiDa: 2,
        nguoiOCung: '',
        ngayBanGiao: '2026-01-10',
        hienTrang: 'Sàn gỗ, gác lửng, 1 máy lạnh, 1 nóng lạnh, bàn làm việc, 2 chìa khóa.',
        chiSoBanGiao: 'Điện 400 kWh · Nước 150 m³',
        soNgayBaoTruoc: 45, soNgayHoanCoc: 30,
        dieuKhoan: 'Thanh toán trước ngày 28 hằng tháng. Không tự ý cải tạo kết cấu.',
        dieuKienChamDut: 'Báo trước 45 ngày khi chấm dứt; vi phạm nội quy có thể chấm dứt ngay.',
        khauTruCoc: 'Khấu trừ hư hỏng, công nợ và phí dọn dẹp nếu có.',
        xuLyTreHan: 'Phí chậm thanh toán 0,1%/ngày.',
        tranhChap: 'Ưu tiên thương lượng.',
        boSung: 'Được sử dụng khu vực sân thượng chung.',
        ...chuNha, trangThai: 'hieuluc'
      }
    ],

    hoadon: [
      { id: 'h1010', ma: 'PT-101-2610', ky: '2026-10', phongId: 'p101', khachId: 'k001', tienPhong: 3500000, soDien: 120, giaDien: 3500, tienDien: 420000, soNuoc: 8, giaNuoc: 15000, tienNuoc: 120000, phiDichVu: 100000, tong: 4140000, han: '2026-10-05', daGui: true, trangThai: 'hieuluc', ngayTao: '2026-10-01' },
      { id: 'h1020', ma: 'PT-102-2610', ky: '2026-10', phongId: 'p102', khachId: 'k002', tienPhong: 3500000, soDien: 105, giaDien: 3500, tienDien: 367500, soNuoc: 9, giaNuoc: 15000, tienNuoc: 135000, phiDichVu: 100000, tong: 4102500, han: '2026-10-10', daGui: true, trangThai: 'hieuluc', ngayTao: '2026-10-01' },
      { id: 'h2010', ma: 'PT-201-2610', ky: '2026-10', phongId: 'p201', khachId: 'k003', tienPhong: 4200000, soDien: 150, giaDien: 3500, tienDien: 525000, soNuoc: 12, giaNuoc: 15000, tienNuoc: 180000, phiDichVu: 120000, tong: 5025000, han: '2026-10-05', daGui: false, trangThai: 'hieuluc', ngayTao: '2026-10-01' },
      { id: 'h3010', ma: 'PT-301-2610', ky: '2026-10', phongId: 'p301', khachId: 'k004', tienPhong: 4800000, soDien: 130, giaDien: 3500, tienDien: 455000, soNuoc: 10, giaNuoc: 15000, tienNuoc: 150000, phiDichVu: 150000, tong: 5555000, han: '2026-10-28', daGui: true, trangThai: 'hieuluc', ngayTao: '2026-10-01' },
      { id: 'h1011', ma: 'PT-101-2611', ky: '2026-11', phongId: 'p101', khachId: 'k001', tienPhong: 3500000, soDien: 96, giaDien: 3500, tienDien: 336000, soNuoc: 7, giaNuoc: 15000, tienNuoc: 105000, phiDichVu: 100000, tong: 3941000, han: '2026-11-05', daGui: true, trangThai: 'hieuluc', ngayTao: '2026-11-01' },
      { id: 'h1021', ma: 'PT-102-2611', ky: '2026-11', phongId: 'p102', khachId: 'k002', tienPhong: 3500000, soDien: 110, giaDien: 3500, tienDien: 385000, soNuoc: 8, giaNuoc: 15000, tienNuoc: 120000, phiDichVu: 100000, tong: 4105000, han: '2026-11-10', daGui: true, trangThai: 'hieuluc', ngayTao: '2026-11-01' },
      { id: 'h2011', ma: 'PT-201-2611', ky: '2026-11', phongId: 'p201', khachId: 'k003', tienPhong: 4200000, soDien: 140, giaDien: 3500, tienDien: 490000, soNuoc: 11, giaNuoc: 15000, tienNuoc: 165000, phiDichVu: 120000, tong: 4975000, han: '2026-11-05', daGui: false, trangThai: 'hieuluc', ngayTao: '2026-11-01' },
      { id: 'h3011', ma: 'PT-301-2611', ky: '2026-11', phongId: 'p301', khachId: 'k004', tienPhong: 4800000, soDien: 130, giaDien: 3500, tienDien: 455000, soNuoc: 10, giaNuoc: 15000, tienNuoc: 150000, phiDichVu: 150000, tong: 5555000, han: '2026-11-28', daGui: true, trangThai: 'hieuluc', ngayTao: '2026-11-01' }
    ],

    thanhtoan: [
      { id: 'tt01', hoaDonId: 'h1010', soTien: 4140000, phuongThuc: 'Chuyển khoản', ghiChu: 'Đã nhận đủ', ngay: '2026-10-03' },
      { id: 'tt02', hoaDonId: 'h1020', soTien: 2000000, phuongThuc: 'Tiền mặt', ghiChu: 'Khách trả trước một phần', ngay: '2026-10-15' },
      { id: 'tt03', hoaDonId: 'h3010', soTien: 5555000, phuongThuc: 'Chuyển khoản', ghiChu: '', ngay: '2026-10-27' },
      { id: 'tt04', hoaDonId: 'h1011', soTien: 1500000, phuongThuc: 'Chuyển khoản', ghiChu: 'Chuyển trước', ngay: '2026-11-08' },
      { id: 'tt05', hoaDonId: 'h1021', soTien: 4105000, phuongThuc: 'Tiền mặt', ghiChu: 'Thu đủ', ngay: '2026-11-09' },
      { id: 'tt06', hoaDonId: 'h3011', soTien: 1000000, phuongThuc: 'Chuyển khoản', ghiChu: 'Trả một phần', ngay: '2026-11-07' }
    ],

    chiso: [
      { id: 'cs1010', ky: '2026-10', phongId: 'p101', dienDau: 1200, dienCuoi: 1320, nuocDau: 300, nuocCuoi: 308, ngayChot: '2026-10-01' },
      { id: 'cs1020', ky: '2026-10', phongId: 'p102', dienDau: 860, dienCuoi: 965, nuocDau: 210, nuocCuoi: 219, ngayChot: '2026-10-01' },
      { id: 'cs2010', ky: '2026-10', phongId: 'p201', dienDau: 1500, dienCuoi: 1650, nuocDau: 400, nuocCuoi: 412, ngayChot: '2026-10-01' },
      { id: 'cs3010', ky: '2026-10', phongId: 'p301', dienDau: 400, dienCuoi: 530, nuocDau: 150, nuocCuoi: 160, ngayChot: '2026-10-01' },
      { id: 'cs1011', ky: '2026-11', phongId: 'p101', dienDau: 1320, dienCuoi: 1416, nuocDau: 308, nuocCuoi: 315, ngayChot: '2026-11-01' },
      { id: 'cs1021', ky: '2026-11', phongId: 'p102', dienDau: 965, dienCuoi: 1075, nuocDau: 219, nuocCuoi: 227, ngayChot: '2026-11-01' },
      { id: 'cs2011', ky: '2026-11', phongId: 'p201', dienDau: 1650, dienCuoi: 1790, nuocDau: 412, nuocCuoi: 423, ngayChot: '2026-11-01' },
      { id: 'cs3011', ky: '2026-11', phongId: 'p301', dienDau: 530, dienCuoi: 660, nuocDau: 160, nuocCuoi: 170, ngayChot: '2026-11-01' }
    ],

    suco: [
      { id: 'sc001', ma: 'SC-0001', phongId: 'p101', khachId: 'k001', tieuDe: 'Vòi nước nhà tắm bị rò rỉ', phanLoai: 'Nước', mucDo: 'Trung bình', moTa: 'Nước rò rỉ ở chân vòi, sàn nhà tắm bị ướt mỗi lần sử dụng.', ngayGui: '2026-11-08T09:20', trangThai: 'moi', nguoiXuLy: '', chiPhi: 0, nguoiBao: 'Nguyễn Văn An', sdt: '0901234567' },
      { id: 'sc002', ma: 'SC-0002', phongId: 'p102', khachId: 'k002', tieuDe: 'Ổ cắm phòng khách bị chập', phanLoai: 'Điện', mucDo: 'Cao', moTa: 'Cắm sạc là có tiếng nổ nhỏ, đã ngắt cầu dao khu vực.', ngayGui: '2026-11-07T18:45', trangThai: 'dangxuly', nguoiXuLy: 'Phan Văn Tú', chiPhi: 250000, nguoiBao: 'Trần Thị Bích', sdt: '0912345678' },
      { id: 'sc003', ma: 'SC-0003', phongId: 'p201', khachId: 'k003', tieuDe: 'Máy lạnh không mát', phanLoai: 'Cơ sở vật chất', mucDo: 'Trung bình', moTa: 'Máy lạnh chạy nhưng chỉ có gió, phòng rất nóng.', ngayGui: '2026-10-20T14:10', trangThai: 'hoanthanh', nguoiXuLy: 'Phan Văn Tú', chiPhi: 450000, nguoiBao: 'Lê Minh Cường', sdt: '0923456789' },
      { id: 'sc004', ma: 'SC-0004', phongId: 'p301', khachId: 'k004', tieuDe: 'Hành lang tầng 3 có mùi ẩm', phanLoai: 'Vệ sinh', mucDo: 'Thấp', moTa: 'Mùi ẩm xuất hiện từ cuối tuần, mong được kiểm tra.', ngayGui: '2026-11-09T08:05', trangThai: 'moi', nguoiXuLy: '', chiPhi: 0, nguoiBao: 'Phạm Thu Hà', sdt: '0934567890' },
      { id: 'sc005', ma: 'SC-0005', phongId: 'p101', khachId: 'k001', tieuDe: 'Cửa chính khó khóa', phanLoai: 'An ninh', mucDo: 'Cao', moTa: 'Ổ khóa bị kẹt, phải lắc mạnh mới khóa được.', ngayGui: '2026-10-28T21:30', trangThai: 'dangxuly', nguoiXuLy: 'Phan Văn Tú', chiPhi: 0, nguoiBao: 'Nguyễn Văn An', sdt: '0901234567' }
    ],

    thongbao: [
      { id: 'tb001', tieuDe: 'Lịch thu tiền tháng 11/2026', noiDung: 'Kính mời quý khách thanh toán tiền phòng và dịch vụ trước ngày 05/11. Hỗ trợ chuyển khoản hoặc nộp trực tiếp tại văn phòng.', ngayDang: '2026-11-01' },
      { id: 'tb002', tieuDe: 'Bảo trì hệ thống điện Khu A', noiDung: 'Ngày 12/11 từ 8h00 đến 11h00 sẽ tạm ngắt điện Khu A để bảo trì. Mong quý khách sắp xếp công việc.', ngayDang: '2026-11-06' },
      { id: 'tb003', tieuDe: 'Quy định giữ xe và giờ giấc', noiDung: 'Xe máy gửi tại tầng trệt, đeo thẻ xe khi ra vào. Giữ trật tự sau 22h00. Cảm ơn quý khách hợp tác.', ngayDang: '2026-10-15' }
    ],

    chiphi: [
      { id: 'cp001', ngay: '2026-11-03', ten: 'Sửa ổ cắm phòng 102', danhMuc: 'Sửa chữa', khuVuc: 'Khu A', soTien: 250000, ghiChu: 'Thay ổ cắm và aptomat nhánh' },
      { id: 'cp002', ngay: '2026-11-05', ten: 'Thay vòi sen phòng 101', danhMuc: 'Sửa chữa', khuVuc: 'Khu A', soTien: 180000, ghiChu: '' },
      { id: 'cp003', ngay: '2026-11-08', ten: 'Vệ sinh hành lang Khu B', danhMuc: 'Vận hành', khuVuc: 'Khu B', soTien: 400000, ghiChu: 'Dọn dẹp và khử mùi' },
      { id: 'cp004', ngay: '2026-10-12', ten: 'Sửa máy lạnh phòng 201', danhMuc: 'Sửa chữa', khuVuc: 'Khu A', soTien: 450000, ghiChu: 'Nạp gas, vệ sinh dàn lạnh' },
      { id: 'cp005', ngay: '2026-10-01', ten: 'Internet tháng 10', danhMuc: 'Vận hành', khuVuc: 'Toàn bộ', soTien: 600000, ghiChu: '' },
      { id: 'cp006', ngay: '2026-11-01', ten: 'Internet tháng 11', danhMuc: 'Vận hành', khuVuc: 'Toàn bộ', soTien: 600000, ghiChu: '' },
      { id: 'cp007', ngay: '2026-11-09', ten: 'Thay bóng đèn tầng 3', danhMuc: 'Bảo trì', khuVuc: 'Khu B', soTien: 120000, ghiChu: '' },
      { id: 'cp008', ngay: '2026-11-02', ten: 'Lương bảo vệ tuần 1', danhMuc: 'Vận hành', khuVuc: 'Toàn bộ', soTien: 1200000, ghiChu: '' }
    ],

    dichvu: [
      { id: 'dv001', ten: 'Điện', donVi: 'kWh', donGia: 3500 },
      { id: 'dv002', ten: 'Nước', donVi: 'm³', donGia: 15000 },
      { id: 'dv003', ten: 'Internet', donVi: 'phòng/tháng', donGia: 100000 },
      { id: 'dv004', ten: 'Giữ xe máy', donVi: 'xe/tháng', donGia: 70000 },
      { id: 'dv005', ten: 'Giặt ủi', donVi: 'kg', donGia: 12000 },
      { id: 'dv006', ten: 'Vệ sinh chung', donVi: 'phòng/tháng', donGia: 50000 }
    ]
  };
}

/* ------------------------------------------------------------
   Kho dữ liệu: đọc, ghi, thêm, sửa, xóa
   ------------------------------------------------------------ */
const DL = (function () {
  let boNho = null;

  function luu() {
    try {
      localStorage.setItem(KHOA_DB, JSON.stringify(boNho));
    } catch (e) {
      console.error('Không lưu được dữ liệu:', e);
    }
  }

  function doc() {
    if (boNho) return boNho;
    let du = null;
    try {
      const raw = localStorage.getItem(KHOA_DB);
      if (raw) du = JSON.parse(raw);
    } catch (e) {
      du = null;
    }
    if (!du || !Array.isArray(du.phong)) du = duLieuMau();
    boNho = du;
    luu();
    return boNho;
  }

  /* Lấy toàn bộ bảng */
  function lay(bang) {
    return doc()[bang] || [];
  }

  /* Tìm một bản ghi theo id */
  function tim(bang, id) {
    return lay(bang).find(function (x) { return x.id === id; }) || null;
  }

  /* Thêm bản ghi mới, tự sinh id */
  function them(bang, obj) {
    const ds = lay(bang);
    if (!obj.id) obj.id = taoId(bang);
    ds.push(obj);
    luu();
    return obj;
  }

  /* Cập nhật một phần bản ghi */
  function sua(bang, id, thayDoi) {
    const o = tim(bang, id);
    if (!o) return null;
    Object.assign(o, thayDoi);
    luu();
    return o;
  }

  /* Xóa bản ghi */
  function xoa(bang, id) {
    const ds = lay(bang);
    const i = ds.findIndex(function (x) { return x.id === id; });
    if (i < 0) return false;
    ds.splice(i, 1);
    luu();
    return true;
  }

  /* Khôi phục dữ liệu mẫu */
  function datLai() {
    boNho = duLieuMau();
    luu();
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
      if (p.trangThai !== moi) p.trangThai = moi;
    });
    luu();
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

  /* Lưu chỉ số điện nước (ghi mới hoặc cập nhật theo kỳ) */
  function luuChiSo(phongId, ky, du) {
    const daCo = lay('chiso').find(function (c) {
      return c.phongId === phongId && c.ky === ky;
    });
    if (daCo) return sua('chiso', daCo.id, du);
    return them('chiso', Object.assign({ phongId: phongId, ky: ky }, du));
  }

  /* ===== Tài khoản & đăng nhập ===== */

  function nguoiDungCuaHoSo(hoSoId, loaiHoSo) {
    return lay('nguoidung').find(function (u) {
      return u.hoSoId === hoSoId && u.loaiHoSo === loaiHoSo;
    }) || null;
  }

  /* Đổi email/SĐT thành tên đăng nhập nội bộ */
  function tenDangNhapTuHoSo(hoso) {
    const email = (hoso.email || '').trim().toLowerCase();
    if (email) return email;
    return String(hoso.sdt || '').trim() + '@tenant.local';
  }

  function taoMatKhauTam() {
    return 'Tam@' + Math.floor(100000 + Math.random() * 900000);
  }

  /* Cấp tài khoản mới với mật khẩu tạm, trả về mật khẩu để hiển thị một lần */
  function capTaiKhoan(o) {
    const ten = tenDangNhapTuHoSo(o);
    const daCo = lay('nguoidung').find(function (u) {
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
      phaiDoiMatKhau: true,
      ngayTao: _homNay()
    });
    return { ok: true, nguoidung: u, matKhau: matKhau };
  }

  /* Đặt lại mật khẩu tạm */
  function datLaiMatKhau(userId) {
    const matKhau = taoMatKhauTam();
    sua('nguoidung', userId, { matKhau: matKhau, phaiDoiMatKhau: true, trangThai: 'hoatdong' });
    return matKhau;
  }

  function khoaTaiKhoan(userId, khoa) {
    return sua('nguoidung', userId, { trangThai: khoa ? 'khoa' : 'hoatdong' });
  }

  function dangNhap(tenDangNhap, matKhau, ghiNho) {
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

  function dangXuat() {
    localStorage.removeItem(KHOA_PHIEN);
    sessionStorage.removeItem(KHOA_PHIEN_TAM);
  }

  function doiMatKhau(userId, matKhauMoi) {
    return sua('nguoidung', userId, { matKhau: matKhauMoi, phaiDoiMatKhau: false });
  }

  return {
    lay: lay, tim: tim, them: them, sua: sua, xoa: xoa, datLai: datLai,
    hopDongHieuLuc: hopDongHieuLuc, hopDongCuaKhach: hopDongCuaKhach,
    hoaDonTrongKy: hoaDonTrongKy, daThu: daThu, conNo: conNo,
    trangThaiHoaDon: trangThaiHoaDon, cotKanban: cotKanban,
    dongBoPhong: dongBoPhong, tinhTong: tinhTong,
    goiYChiSo: goiYChiSo, luuChiSo: luuChiSo,
    nguoiDungCuaHoSo: nguoiDungCuaHoSo, tenDangNhapTuHoSo: tenDangNhapTuHoSo,
    capTaiKhoan: capTaiKhoan, datLaiMatKhau: datLaiMatKhau, khoaTaiKhoan: khoaTaiKhoan,
    dangNhap: dangNhap, phien: phien, dangXuat: dangXuat, doiMatKhau: doiMatKhau
  };
})();

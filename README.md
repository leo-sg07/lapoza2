
# 🚀 Hướng dẫn triển khai ShiftMaster Pro (Lapoza v1.0)

Hệ thống quản lý ca trực và điểm danh thông minh của bạn đã sẵn sàng để "lên sóng".

## 🛠 Yêu cầu hệ thống
- Mã nguồn ứng dụng (React + ESM).
- Google Gemini API Key.
- Hosting hỗ trợ HTTPS (Vercel, Netlify, hoặc GitHub Pages).

## 📦 Các bước triển khai nhanh

### Bước 1: Chuẩn bị mã nguồn
Đảm bảo bạn có các file cốt lõi sau:
- `index.html`
- `App.tsx`
- `types.ts`
- `constants.ts`
- Các components trong thư mục `/components`

### Bước 2: Triển khai lên Vercel (Khuyên dùng)
1. Đẩy mã nguồn lên một Repository trên **GitHub**.
2. Đăng nhập vào [Vercel](https://vercel.com).
3. Chọn **New Project** -> Import repository vừa tạo.
4. Tại phần **Environment Variables**, thêm:
   - Key: `API_KEY`
   - Value: `MÃ_API_GEMINI_CỦA_BẠN`
5. Nhấn **Deploy**.

### Bước 3: Cấu hình SPA Routing
Để tránh lỗi 404 khi tải lại trang ở các đường dẫn khác nhau (nếu có routing sau này), hãy thêm file `vercel.json` vào thư mục gốc:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## ⚠️ Lưu ý quan trọng
- **Quyền Camera & Vị trí:** Trình duyệt chỉ cho phép sử dụng các tính năng này qua kết nối **HTTPS** bảo mật.
- **Bảo mật:** Không bao giờ dán trực tiếp API Key vào code. Luôn sử dụng biến môi trường `process.env.API_KEY`.
- **Trải nghiệm Mobile:** App được tối ưu cho di động. Hãy sử dụng tính năng "Add to Home Screen" trên điện thoại để dùng như App thật.

---
*Phát triển bởi Senior Frontend Engineer với sự hỗ trợ của Gemini API.*

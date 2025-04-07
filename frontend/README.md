# Energy AI Optimizer - Frontend

Giao diện người dùng cho hệ thống Energy AI Optimizer, được xây dựng với React, TypeScript và Tailwind CSS.

## Tính năng
- **Dashboard năng lượng**: Hiển thị tổng quan tiêu thụ năng lượng, bất thường, và khuyến nghị tiết kiệm
- **Phân tích chuyên sâu**: Phân tích chi tiết mẫu tiêu thụ năng lượng
- **Dự báo**: Dự báo tiêu thụ năng lượng trong tương lai
- **Báo cáo**: Tạo báo cáo về hiệu suất năng lượng
- **Giao diện theo vai trò**: Tùy chỉnh nội dung hiển thị dựa trên vai trò người dùng (Quản lý cơ sở, Chuyên gia năng lượng, Quản lý cấp cao)

## Cài đặt

### Yêu cầu
- Node.js 14.x trở lên
- npm 6.x trở lên

### Hướng dẫn cài đặt

1. Clone repository:
```
git clone <repository-url>
```

2. Di chuyển vào thư mục frontend:
```
cd energy-ai-optimizer/frontend
```

3. Cài đặt các dependency:
```
npm install
```

4. Tạo file .env:
```
cp .env.example .env
```

5. Cấu hình đường dẫn API trong file .env:
```
REACT_APP_API_URL=http://localhost:8000
```

## Sử dụng

### Chạy ứng dụng trong môi trường phát triển
```
npm start
```
Ứng dụng sẽ chạy tại địa chỉ [http://localhost:3000](http://localhost:3000).

### Build ứng dụng cho môi trường sản xuất
```
npm run build
```

### Kiểm tra lỗi và định dạng code
```
npm run lint
```

## Cấu trúc thư mục

```
/src
  /components        - Các component UI
    /dashboard       - Components cho Dashboard năng lượng
      /charts        - Biểu đồ hiển thị dữ liệu năng lượng
    /analytics       - Components cho phân tích dữ liệu
    /forecasting     - Components cho dự báo năng lượng
    /reports         - Components cho báo cáo
    /chat            - Giao diện chat ngôn ngữ tự nhiên
    /layout          - Components bố cục (Header, Sidebar)
    /common          - Components dùng chung

  /pages             - Các trang chính
    /facility-manager - Trang cho Quản lý cơ sở
    /energy-analyst   - Trang cho Chuyên gia năng lượng
    /executive        - Trang cho Quản lý cấp cao

  /services          - Logic giao tiếp với backend
    /api             - API client

  /hooks             - Custom React hooks
  /utils             - Các hàm tiện ích
  /context           - React context providers
  /styles            - Global styles và themes
```

## Công nghệ sử dụng

- **React**: Framework UI
- **TypeScript**: Kiểu dữ liệu tĩnh
- **Tailwind CSS**: Styling
- **React Query**: Quản lý trạng thái và fetch data
- **React Router**: Routing
- **Chart.js/Recharts**: Hiển thị biểu đồ
- **Axios**: HTTP client
- **React Hook Form**: Quản lý form
- **Zustand**: Quản lý state

## Kết nối với Backend

Frontend kết nối với Python backend thông qua RESTful API. API endpoints được định nghĩa trong thư mục `src/services/api`. Mặc định, frontend sẽ kết nối với backend tại địa chỉ `http://localhost:8000`.

## Vai trò người dùng

- **Quản lý cơ sở**: Tập trung vào dữ liệu vận hành hằng ngày và các khuyến nghị thực tế
- **Chuyên gia năng lượng**: Xem phân tích chi tiết kỹ thuật và tối ưu hóa nâng cao
- **Quản lý cấp cao**: Xem tổng quan danh mục tòa nhà và các chỉ số tài chính
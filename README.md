# Energy AI Optimizer (EAIO)

Energy AI Optimizer là một hệ thống đa tác tử (multi-agent system) sử dụng trí tuệ nhân tạo để phân tích và tối ưu hóa tiêu thụ năng lượng cho các tòa nhà dựa trên dữ liệu từ BDG2 Dataset (Building Data Genome 2).

## Tính năng

- 🏢 **Quản lý tòa nhà**: Theo dõi thông tin chi tiết và mức tiêu thụ năng lượng của nhiều tòa nhà
- 📊 **Phân tích dữ liệu**: Phân tích các mô hình tiêu thụ và xác định xu hướng
- 🔍 **Phát hiện bất thường**: Tự động phát hiện mức tiêu thụ bất thường
- 💡 **Đề xuất tối ưu hóa**: Đề xuất thông minh để giảm tiêu thụ năng lượng
- 📈 **Dự báo**: Dự đoán nhu cầu năng lượng tương lai và mô phỏng kịch bản
- 📑 **Báo cáo**: Tạo báo cáo tùy chỉnh về hiệu suất năng lượng

## Kiến trúc

Hệ thống sử dụng kiến trúc đa tác tử (multi-agent) được xây dựng với Microsoft AutoGen và OpenAI GPT-4o Mini:

- **Backend**: Python, FastAPI, MongoDB, Redis
- **Frontend**: Node.js, React, TypeScript
- **Tác tử AI**:
  - Data Analysis Agent: Phân tích dữ liệu năng lượng
  - Recommendation Agent: Đề xuất giải pháp tối ưu
  - Forecasting Agent: Dự báo tiêu thụ năng lượng
  - Commander Agent: Điều phối các tác tử khác

## Cài đặt

### Yêu cầu

- Docker và Docker Compose
- OpenAI API Key cho GPT-4o Mini
- Weather API Key (tùy chọn)

### Bước cài đặt

1. Clone repository:
   ```bash
   git clone https://github.com/fistdat/EAIO.git
   cd EAIO
   ```

2. Tạo file môi trường:
   ```bash
   cp .env.example .env
   ```

3. Cập nhật API keys trong file `.env`

4. Khởi chạy hệ thống:
   ```bash
   docker-compose up -d
   ```

5. Truy cập ứng dụng tại http://localhost:3000

## Giấy phép

© 2024 Energy AI Optimizer. All rights reserved. 
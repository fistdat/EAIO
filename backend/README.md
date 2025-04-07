# Energy AI Optimizer - Backend

Backend cho hệ thống Energy AI Optimizer, được xây dựng với Python, FastAPI, và Microsoft AutoGen.

## Tính năng
- **Hệ thống đa tác tử AI**: Phân tích năng lượng, đưa ra khuyến nghị, dự báo tiêu thụ
- **Phân tích dữ liệu BDG2**: Xử lý dữ liệu tòa nhà từ Building Data Genome 2 dataset
- **Phân tích thời tiết**: Tương quan giữa thời tiết và tiêu thụ năng lượng
- **API RESTful**: Kết nối với giao diện người dùng frontend
- **Bộ nhớ hệ thống**: Lưu trữ phân tích lịch sử và tương tác

## Tác tử AI
Hệ thống bao gồm các tác tử sau, được xây dựng trên nền tảng Microsoft AutoGen:

1. **DataAnalysisAgent**: Phân tích dữ liệu năng lượng, xác định mẫu và bất thường
2. **RecommendationAgent**: Đề xuất chiến lược tối ưu hóa năng lượng
3. **ForecastingAgent**: Dự báo tiêu thụ năng lượng dựa trên dữ liệu lịch sử
4. **CommanderAgent**: Điều phối luồng công việc giữa các tác tử
5. **MemoryAgent**: Duy trì kiến thức hệ thống và lịch sử tiêu thụ năng lượng
6. **EvaluatorAgent**: Đánh giá kết quả của các chiến lược tối ưu hóa năng lượng
7. **AdapterAgent**: Giao tiếp với hệ thống tòa nhà, API thời tiết, và hệ thống giám sát năng lượng

## Cài đặt

### Yêu cầu
- Python 3.9+
- pip

### Hướng dẫn cài đặt

1. Clone repository:
```
git clone <repository-url>
```

2. Di chuyển vào thư mục backend:
```
cd energy-ai-optimizer/backend
```

3. Tạo môi trường ảo:
```
python -m venv venv
```

4. Kích hoạt môi trường ảo:
```
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

5. Cài đặt các dependency:
```
pip install -r requirements.txt
```

6. Tạo file .env:
```
cp .env.example .env
```

7. Cấu hình các biến môi trường trong file .env:
```
OPENAI_API_KEY=your_api_key
WEATHER_API_KEY=your_weather_api_key
```

## Sử dụng

### Chạy API
```
uvicorn api.main:app --reload --port 8000
```
API sẽ chạy tại địa chỉ [http://localhost:8000](http://localhost:8000).

### API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/buildings` | GET | Lấy danh sách tòa nhà |
| `/api/buildings/{id}` | GET | Lấy thông tin tòa nhà |
| `/api/buildings/{id}/consumption` | GET | Lấy dữ liệu tiêu thụ năng lượng |
| `/api/analysis/patterns` | POST | Phân tích mẫu tiêu thụ |
| `/api/analysis/anomalies` | POST | Phát hiện bất thường |
| `/api/recommendations` | POST | Tạo khuyến nghị tối ưu hóa |
| `/api/forecasting` | POST | Dự báo tiêu thụ tương lai |
| `/api/weather` | GET | Lấy dữ liệu thời tiết |
| `/api/weather/correlation` | POST | Phân tích tương quan thời tiết |
| `/api/memory` | POST | Lưu dữ liệu phân tích |
| `/api/memory/{id}` | GET | Lấy dữ liệu phân tích đã lưu |
| `/api/evaluator/recommendations` | POST | Đánh giá khuyến nghị |
| `/api/evaluator/forecasts` | POST | Đánh giá dự báo |
| `/api/commander` | POST | Gửi truy vấn tới hệ thống đa tác tử |

## Cấu trúc thư mục

```
/backend
  /agents                - Tác tử AI sử dụng Microsoft AutoGen
    /data_analysis       - Tác tử phân tích dữ liệu
    /recommendation      - Tác tử đề xuất tối ưu hóa
    /forecasting         - Tác tử dự báo tiêu thụ
    /commander           - Tác tử điều phối
    /memory              - Tác tử lưu trữ
    /evaluator           - Tác tử đánh giá
    /adapter             - Tác tử kết nối với hệ thống bên ngoài
    base_agent.py        - Lớp cơ sở cho tất cả các tác tử

  /api                   - API endpoints FastAPI
    /routes              - Định nghĩa routes
    main.py              - Ứng dụng FastAPI chính

  /data                  - Xử lý dữ liệu
    /building            - Xử lý dữ liệu tòa nhà (BDG2 Dataset)
    /weather             - Xử lý dữ liệu thời tiết
    /metadata            - Quản lý metadata tòa nhà

  /models                - Mô hình machine learning
  /utils                 - Các hàm tiện ích
  /config                - File cấu hình
  /tests                 - Unit tests
```

## Xử lý dữ liệu BDG2
Energy AI Optimizer sử dụng Building Data Genome 2 (BDG2) dataset để phân tích tiêu thụ năng lượng. Dữ liệu được xử lý và làm sạch qua các bước sau:
1. Đọc dữ liệu metadata và tiêu thụ từ các file CSV
2. Xử lý giá trị thiếu bằng các phương pháp nội suy phù hợp
3. Chuẩn hóa dữ liệu tiêu thụ theo diện tích tòa nhà (kWh/m²)
4. Phát hiện và loại bỏ các giá trị ngoại lai
5. Tạo các tính năng thời gian (giờ, ngày, ngày trong tuần, tháng, mùa)

## Tích hợp Thời tiết
Hệ thống tương quan dữ liệu thời tiết với tiêu thụ năng lượng thông qua:
1. Thu thập dữ liệu thời tiết lịch sử cho vị trí tòa nhà
2. Tính toán đơn vị độ ngày sưởi và làm mát (HDD/CDD)
3. Phân tích tương quan giữa thời tiết và các mẫu tiêu thụ
4. Chuẩn hóa dữ liệu năng lượng cho ảnh hưởng của thời tiết

## Xây dựng và Mở rộng
Để thêm tính năng mới:
1. Tạo tác tử mới trong thư mục `/agents` hoặc mở rộng tác tử hiện có
2. Cập nhật CommanderAgent để xử lý loại truy vấn mới
3. Thêm endpoint API mới trong thư mục `/api/routes`
4. Cập nhật tài liệu API và Swagger
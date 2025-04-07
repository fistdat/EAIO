# Hướng dẫn triển khai Energy AI Optimizer

Tài liệu này cung cấp hướng dẫn chi tiết để triển khai hệ thống Energy AI Optimizer trong môi trường phát triển hoặc sản xuất.

## Triển khai với Docker (Khuyến nghị)

### Yêu cầu
- Docker
- Docker Compose
- Git

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd energy-ai-optimizer
```

### Bước 2: Cấu hình biến môi trường
```bash
# Tạo file .env trong thư mục gốc
cp .env.example .env

# Chỉnh sửa file .env để cấu hình các API key và biến môi trường
# OPENAI_API_KEY=your-openai-api-key
# WEATHER_API_KEY=your-weather-api-key
```

### Bước 3: Khởi động các dịch vụ với Docker Compose
```bash
docker-compose up -d
```

Lệnh này sẽ khởi động tất cả các dịch vụ cần thiết:
- Backend (FastAPI, Python): http://localhost:8000
- Frontend (React): http://localhost:3000
- MongoDB: localhost:27017
- Redis: localhost:6379
- Milvus (vector database): localhost:19530
- MinIO (object storage): localhost:9000
- Etcd (configuration storage): localhost:2379

### Bước 4: Kiểm tra trạng thái các dịch vụ
```bash
docker-compose ps
```

### Bước 5: Truy cập ứng dụng
- Frontend: [http://localhost:3000](http://localhost:3000)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Dừng các dịch vụ
```bash
docker-compose down
```

### Xem logs
```bash
# Tất cả các dịch vụ
docker-compose logs

# Chỉ backend
docker-compose logs backend

# Chỉ frontend
docker-compose logs frontend
```

## Triển khai thủ công

### Yêu cầu
- Python 3.9+
- Node.js 14+
- npm 6+
- MongoDB
- Redis
- Git

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd energy-ai-optimizer
```

### Bước 2: Cài đặt và cấu hình backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo Python
python -m venv venv

# Kích hoạt môi trường ảo
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Cài đặt các dependency
pip install -r requirements.txt

# Tạo và cấu hình file .env
cp .env.example .env
# Chỉnh sửa file .env
# OPENAI_API_KEY=your-openai-api-key
# WEATHER_API_KEY=your-weather-api-key
# DATABASE_URL=mongodb://localhost:27017/energy-ai-optimizer
# REDIS_URL=redis://localhost:6379/0
```

### Bước 3: Khởi động backend
```bash
# Vẫn trong thư mục backend với môi trường ảo đã kích hoạt
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend sẽ chạy tại [http://localhost:8000](http://localhost:8000)

### Bước 4: Cài đặt và cấu hình frontend
```bash
# Mở terminal mới, di chuyển vào thư mục frontend
cd frontend

# Cài đặt các dependency
npm install

# Tạo và cấu hình file .env
cp .env.example .env
# Chỉnh sửa file .env
# REACT_APP_API_URL=http://localhost:8000
```

### Bước 5: Khởi động frontend
```bash
# Vẫn trong thư mục frontend
npm start
```

Frontend sẽ chạy tại [http://localhost:3000](http://localhost:3000)

## Triển khai cho môi trường sản xuất

### Docker (Khuyến nghị)

1. Cập nhật file `docker-compose.prod.yml` với cấu hình sản xuất
2. Khởi động các dịch vụ:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Sử dụng dịch vụ đám mây

#### AWS
1. Backend: Triển khai với AWS ECS hoặc AWS Lambda + API Gateway
2. Frontend: Triển khai với AWS S3 + CloudFront
3. Database: Sử dụng MongoDB Atlas hoặc AWS DocumentDB
4. Cache: AWS ElastiCache (Redis)
5. Vector database: Pinecone hoặc tự host Milvus

#### Azure
1. Backend: Azure App Service hoặc Azure Container Instances
2. Frontend: Azure Static Web Apps
3. Database: Azure Cosmos DB hoặc MongoDB Atlas
4. Cache: Azure Cache for Redis
5. Vector database: Pinecone hoặc tự host Milvus

#### Google Cloud
1. Backend: Cloud Run hoặc GKE
2. Frontend: Firebase Hosting
3. Database: MongoDB Atlas hoặc Cloud Firestore
4. Cache: Memorystore (Redis)
5. Vector database: Pinecone hoặc tự host Milvus

## Cấu hình và tối ưu hóa

### Backend

Để tăng hiệu suất backend trong môi trường sản xuất:

1. Sử dụng nhiều worker (Gunicorn):
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker api.main:app
```

2. Cấu hình caching cho các endpoint API phổ biến trong Redis
3. Thêm rate limiting để tránh quá tải
4. Cấu hình CORS đúng cách để bảo mật API

### Frontend

Để tối ưu hóa frontend:

1. Build ứng dụng cho môi trường sản xuất:
```bash
npm run build
```

2. Sử dụng CDN để phân phối nội dung tĩnh
3. Thêm compression (gzip/brotli) cho các file
4. Cấu hình caching đúng cho browser

## Kết nối với dữ liệu BDG2

Để sử dụng Building Data Genome 2 dataset:

1. Tải BDG2 dataset từ [GitHub chính thức](https://github.com/buds-lab/building-data-genome-project-2)
2. Giải nén và đặt các file CSV vào thư mục `/data/bdg2` trong project
3. Cập nhật đường dẫn trong file cấu hình nếu cần

## Khắc phục sự cố

### Vấn đề kết nối database
```bash
# Kiểm tra kết nối MongoDB
docker-compose exec backend python -c "from pymongo import MongoClient; client = MongoClient('mongodb://mongo:27017/'); print(client.server_info())"

# Kiểm tra kết nối Redis
docker-compose exec backend python -c "import redis; r = redis.Redis(host='redis', port=6379); print(r.ping())"
```

### Lỗi API OpenAI
- Kiểm tra API key trong file .env
- Kiểm tra hạn mức và giới hạn tốc độ của API
- Cấu hình retry logic trong mã nguồn

### Vấn đề frontend không kết nối được với backend
- Kiểm tra cấu hình CORS trong backend
- Xác nhận rằng biến môi trường REACT_APP_API_URL đã được cấu hình đúng
- Kiểm tra console trong trình duyệt để tìm lỗi

## Tài liệu tham khảo
- [Tài liệu FastAPI](https://fastapi.tiangolo.com/)
- [Tài liệu React](https://reactjs.org/docs/getting-started.html)
- [Tài liệu Docker Compose](https://docs.docker.com/compose/)
- [Microsoft AutoGen](https://microsoft.github.io/autogen/)
- [Building Data Genome 2 Dataset](https://github.com/buds-lab/building-data-genome-project-2) 
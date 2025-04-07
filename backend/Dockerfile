FROM python:3.9-slim

WORKDIR /app

# Cài đặt các dependency cho hệ thống
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements trước để tận dụng caching của Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ ứng dụng
COPY . .

# Cài đặt package cục bộ
RUN pip install -e .

# Thiết lập PYTHONPATH
ENV PYTHONPATH=/app:$PYTHONPATH

# Tạo thư mục logs và data (nếu chưa có)
RUN mkdir -p /app/data /app/logs

# Port để FastAPI lắng nghe
EXPOSE 8000

# Khởi động ứng dụng (sử dụng main.py ở thư mục gốc)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 
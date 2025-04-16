FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install psycopg2-binary>=2.9.9

# Copy the rest of the application
COPY . .

# Cấu hình PYTHONPATH để hỗ trợ cấu trúc module
ENV PYTHONPATH="${PYTHONPATH}:/app"

# Expose the API port
EXPOSE 8000

# Command to run the application - run directly without reload for better error visibility
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"] 
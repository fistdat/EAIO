#!/bin/bash
# Script to set up environment and start the backend API

# Set working directory
cd /app

# Debug output for troubleshooting
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Set up PYTHONPATH explicitly
export PYTHONPATH=/app
echo "PYTHONPATH: $PYTHONPATH"

# Show Python path for debugging
echo "Python path:"
python -c 'import sys; print(sys.path)'

# Add more debugging information
echo "API directory contents:"
ls -la /app/api/
echo "API routes directory contents:"
ls -la /app/api/routes/

# Test if modules can be imported
python -c "
try:
    import api
    print('Import api: SUCCESS')
    import api.routes
    print('Import api.routes: SUCCESS')
    from api.routes import building_routes
    print('Import building_routes: SUCCESS')
except Exception as e:
    print(f'Import error: {e}')
"

# Kiểm tra các thư viện cần thiết
python -c "
try:
    import pytorch_forecasting
    import pytorch_lightning
    print('Thư viện pytorch_forecasting và pytorch_lightning đã được cài đặt')
except ImportError as e:
    print(f'Thư viện chưa được cài đặt: {e}')
    exit(1)
" || pip install pytorch-forecasting pytorch-lightning

# Install dependencies if needed
pip install --no-cache-dir psycopg2-binary>=2.9.9 psycopg[binary,pool]>=3.1.8 backoff>=2.2.1 tenacity>=8.2.2

# Start the API server
echo "Starting API server..."
# Redirect output to a log file for debugging
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --log-level debug > /app/logs/api_server.log 2>&1 &

# Wait for a second to let server start
sleep 2

# Show the log file
echo "Server log (last 20 lines):"
tail -n 20 /app/logs/api_server.log

# Keep the container running
tail -f /app/logs/api_server.log 
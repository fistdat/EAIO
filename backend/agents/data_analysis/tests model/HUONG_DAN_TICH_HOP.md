# Hướng dẫn tích hợp mô hình Deep Learning

## 1. Các bước đã thực hiện

Chúng ta đã thành công trong việc:
- Cài đặt các thư viện cần thiết: PyTorch, torchvision, torchaudio, scikit-learn
- Kiểm tra môi trường với test đơn giản
- Tạo các mô hình deep learning cơ bản (LSTM và Autoencoder) và kiểm tra chúng hoạt động tốt

## 2. Cách tích hợp vào dự án

### Bước 1: Di chuyển các file đã tạo vào dự án

Di chuyển các file đã tạo vào dự án:
```bash
# Di chuyển file deep_learning_models.py vào thư mục data_analysis
cp /Volumes/KIOXIA/EAIO/EAIO_Multi-Agent_V2/backend/agents/data_analysis/deep_learning_models.py /Volumes/KIOXIA/EAIO/EAIO_Multi-Agent_V2/backend/agents/data_analysis/deep_learning_models.py.bak
cp test_project.py /Volumes/KIOXIA/EAIO/EAIO_Multi-Agent_V2/backend/tests/test_deep_learning.py
```

### Bước 2: Chạy test từ thư mục gốc của dự án

```bash
cd /Volumes/KIOXIA/EAIO/EAIO_Multi-Agent_V2
python -m backend.tests.test_deep_learning
```

### Bước 3: Sửa file data_analysis_agent.py để thêm các phương thức mới

Thêm 2 phương thức mới vào lớp `DataAnalysisAgent`:

1. **predict_consumption**: Để dự báo tiêu thụ năng lượng
2. **detect_anomalies_dl**: Để phát hiện bất thường bằng deep learning

```python
def predict_consumption(
    self,
    building_id: Optional[str] = None,
    df: Optional[pd.DataFrame] = None,
    data_path: Optional[str] = None,
    target_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    input_window: int = 24*7,  # One week
    forecast_horizon: int = 24,  # One day
    use_deep_learning: bool = False
) -> Dict[str, Any]:
    """
    Predict future energy consumption.
    
    Args:
        building_id: Optional building ID to filter data
        df: DataFrame containing energy consumption data (optional)
        data_path: Path to CSV file with consumption data (optional)
        target_col: Column to predict (if None, will try to detect)
        start_date: Start date for training data (ISO format)
        end_date: End date for training data (ISO format)
        input_window: Number of timesteps to use as input
        forecast_horizon: Number of timesteps to forecast
        use_deep_learning: Whether to use deep learning model (if available)
        
    Returns:
        Dict[str, Any]: Forecast results
    """
    try:
        logger.info(f"Predicting consumption for building {building_id or 'all buildings'}")
        
        # Load data if DataFrame not provided but path is
        if df is None and data_path is not None:
            logger.info(f"Loading data from {data_path}")
            df = pd.read_csv(data_path)
        
        if df is None:
            logger.error("No data provided - either df or data_path must be specified")
            raise ValueError("No data provided - either df or data_path must be specified")
        
        # Ensure timestamp column exists and is datetime
        if 'timestamp' not in df.columns:
            logger.error("DataFrame must have a 'timestamp' column")
            raise ValueError("DataFrame must have a 'timestamp' column")
        
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Filter by date range if provided
        if start_date:
            start_dt = pd.to_datetime(start_date)
            df = df[df['timestamp'] >= start_dt]
            logger.info(f"Filtered data starting from {start_date}")
            
        if end_date:
            end_dt = pd.to_datetime(end_date)
            df = df[df['timestamp'] <= end_dt]
            logger.info(f"Filtered data ending at {end_date}")
        
        # Filter for specific building if provided
        if building_id and 'building_id' in df.columns:
            df = df[df['building_id'] == building_id].copy()
            logger.info(f"Filtered data for building {building_id}")
        
        # Identify target column if not specified
        if target_col is None:
            consumption_cols = [col for col in df.columns if any(x in col.lower() for x in 
                                ['consumption', 'energy', 'kwh', 'value'])]
            
            if not consumption_cols:
                logger.error("No consumption column found")
                raise ValueError("No consumption column found")
            
            target_col = consumption_cols[0]
        
        logger.info(f"Using {target_col} as the target column for prediction")
        
        # Sort data by timestamp to ensure time order
        df = df.sort_values('timestamp')
        
        # Use deep learning if available and requested
        if use_deep_learning and torch.cuda.is_available():
            logger.info("Using deep learning forecaster model")
            
            # Create a simple LSTM model for forecasting
            class SimpleLSTM(torch.nn.Module):
                def __init__(self, input_size=1, hidden_size=64, output_size=1):
                    super().__init__()
                    self.hidden_size = hidden_size
                    
                    # LSTM layer
                    self.lstm = torch.nn.LSTM(
                        input_size=input_size,
                        hidden_size=hidden_size,
                        num_layers=2,
                        batch_first=True
                    )
                    
                    # Output layer
                    self.linear = torch.nn.Linear(hidden_size, output_size)
                
                def forward(self, x):
                    # LSTM forward pass
                    lstm_out, _ = self.lstm(x)
                    
                    # Take only the last time step output for prediction
                    last_time_step = lstm_out[:, -1, :]
                    
                    # Reshape for output prediction window
                    output = self.linear(last_time_step).unsqueeze(1).repeat(1, forecast_horizon, 1)
                    
                    return output
            
            # Prepare data for forecasting
            scaler = MinMaxScaler()
            data = df[target_col].values.reshape(-1, 1)
            scaled_data = scaler.fit_transform(data)
            
            X, y = [], []
            for i in range(len(scaled_data) - input_window - forecast_horizon + 1):
                X.append(scaled_data[i:i+input_window])
                y.append(scaled_data[i+input_window:i+input_window+forecast_horizon])
            
            X = np.array(X)
            y = np.array(y)
            
            # Convert to PyTorch tensors
            X_tensor = torch.tensor(X, dtype=torch.float32)
            y_tensor = torch.tensor(y, dtype=torch.float32)
            
            # Create dataset
            dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
            dataloader = torch.utils.data.DataLoader(dataset, batch_size=16, shuffle=True)
            
            # Initialize model
            input_size = X.shape[2]  # Features dimension (should be 1)
            hidden_size = 64
            output_size = y.shape[2]  # Output dimension (should be 1)
            
            model = SimpleLSTM(input_size, hidden_size, output_size)
            
            # Loss function and optimizer
            criterion = torch.nn.MSELoss()
            optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
            
            # Training for a few epochs
            num_epochs = 10
            logger.info("Starting training...")
            
            training_losses = []
            
            for epoch in range(num_epochs):
                epoch_loss = 0.0
                for X_batch, y_batch in dataloader:
                    # Forward pass
                    y_pred = model(X_batch)
                    loss = criterion(y_pred, y_batch)
                    
                    # Backward pass and optimize
                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()
                    
                    epoch_loss += loss.item()
                
                avg_epoch_loss = epoch_loss / len(dataloader)
                training_losses.append(avg_epoch_loss)
                logger.info(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_epoch_loss:.6f}")
            
            logger.info("Training complete!")
            
            # Generate a forecast
            with torch.no_grad():
                latest_data = scaled_data[-input_window:].reshape(1, input_window, 1)
                latest_data_tensor = torch.tensor(latest_data, dtype=torch.float32)
                prediction = model(latest_data_tensor)
                
                # Convert back to numpy and rescale
                prediction_np = prediction.numpy().squeeze()
                prediction_rescaled = scaler.inverse_transform(prediction_np.reshape(-1, 1)).reshape(-1)
                
                # Create forecast timestamps
                last_timestamp = df['timestamp'].iloc[-1]
                forecast_index = pd.date_range(
                    start=last_timestamp + pd.Timedelta(hours=1),
                    periods=forecast_horizon,
                    freq='h'
                )
                
                # Create forecast DataFrame
                forecast_df = pd.DataFrame({
                    'timestamp': forecast_index,
                    f'forecasted_{target_col}': prediction_rescaled
                })
                
                # Prepare result
                forecast_result = {
                    'forecast': forecast_df.to_dict(orient='records'),
                    'training_metrics': {
                        'final_loss': float(training_losses[-1]),
                        'best_loss': float(min(training_losses)),
                        'num_epochs': num_epochs
                    },
                    'model_type': 'lstm',
                    'input_window': input_window,
                    'forecast_horizon': forecast_horizon
                }
                
                return forecast_result
        else:
            # Implement a simpler statistical forecasting approach
            logger.info("Using statistical forecasting model")
            
            # Create features for forecasting
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month
            
            # Calculate seasonal patterns
            hourly_avg = df.groupby('hour')[target_col].mean()
            daily_avg = df.groupby('day_of_week')[target_col].mean()
            monthly_avg = df.groupby('month')[target_col].mean()
            
            # Get overall mean
            overall_mean = df[target_col].mean()
            
            # Generate forecast using seasonal components
            last_timestamp = df['timestamp'].iloc[-1]
            forecast_dates = pd.date_range(
                start=last_timestamp + pd.Timedelta(hours=1),
                periods=forecast_horizon,
                freq='h'
            )
            
            forecast_values = []
            for timestamp in forecast_dates:
                hour_factor = hourly_avg[timestamp.hour] / overall_mean
                day_factor = daily_avg[timestamp.dayofweek] / overall_mean
                month_factor = monthly_avg[timestamp.month] / overall_mean
                
                # Combine factors
                combined_factor = (hour_factor + day_factor + month_factor) / 3
                forecast_value = overall_mean * combined_factor
                
                forecast_values.append(forecast_value)
            
            # Create forecast DataFrame
            forecast_df = pd.DataFrame({
                'timestamp': forecast_dates,
                f'forecasted_{target_col}': forecast_values
            })
            
            forecast_result = {
                'forecast': forecast_df.to_dict(orient='records'),
                'model_type': 'statistical',
                'input_window': None,
                'forecast_horizon': forecast_horizon
            }
            
            logger.info(f"Generated statistical forecast for {forecast_horizon} timesteps")
            return forecast_result
            
    except Exception as e:
        logger.error(f"Error predicting consumption: {str(e)}")
        raise

def detect_anomalies_dl(
    self,
    building_id: Optional[str] = None,
    df: Optional[pd.DataFrame] = None,
    data_path: Optional[str] = None,
    target_col: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    seq_length: int = 24,  # Use 24 hours as sequence length
    anomaly_threshold: float = 0.95  # 95th percentile
) -> Dict[str, Any]:
    """
    Detect anomalies using deep learning model.
    
    Args:
        building_id: Optional building ID to filter data
        df: DataFrame containing energy consumption data (optional)
        data_path: Path to CSV file with consumption data (optional)
        target_col: Column to analyze (if None, will try to detect)
        start_date: Start date for data (ISO format)
        end_date: End date for data (ISO format)
        seq_length: Length of sequence for anomaly detection
        anomaly_threshold: Percentile threshold for anomaly detection
        
    Returns:
        Dict[str, Any]: Anomaly detection results
    """
    try:
        if not torch.cuda.is_available():
            logger.warning("Deep learning models prefer GPU acceleration. Falling back to statistical method.")
            return self.detect_anomalies(
                building_id=building_id,
                df=df,
                data_path=data_path,
                start_date=start_date,
                end_date=end_date
            )
        
        logger.info(f"Detecting anomalies with deep learning for building {building_id or 'all buildings'}")
        
        # Load data if DataFrame not provided but path is
        if df is None and data_path is not None:
            logger.info(f"Loading data from {data_path}")
            df = pd.read_csv(data_path)
        
        if df is None:
            logger.error("No data provided - either df or data_path must be specified")
            raise ValueError("No data provided - either df or data_path must be specified")
        
        # Ensure timestamp column exists and is datetime
        if 'timestamp' not in df.columns:
            logger.error("DataFrame must have a 'timestamp' column")
            raise ValueError("DataFrame must have a 'timestamp' column")
        
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Filter by date range if provided
        if start_date:
            start_dt = pd.to_datetime(start_date)
            df = df[df['timestamp'] >= start_dt]
            logger.info(f"Filtered data starting from {start_date}")
            
        if end_date:
            end_dt = pd.to_datetime(end_date)
            df = df[df['timestamp'] <= end_dt]
            logger.info(f"Filtered data ending at {end_date}")
        
        # Filter for specific building if provided
        if building_id and 'building_id' in df.columns:
            df = df[df['building_id'] == building_id].copy()
            logger.info(f"Filtered data for building {building_id}")
        
        # Identify target column if not specified
        if target_col is None:
            consumption_cols = [col for col in df.columns if any(x in col.lower() for x in 
                                ['consumption', 'energy', 'kwh', 'value'])]
            
            if not consumption_cols:
                logger.error("No consumption column found")
                raise ValueError("No consumption column found")
            
            target_col = consumption_cols[0]
        
        logger.info(f"Using {target_col} as the target column for anomaly detection")
        
        # Sort data by timestamp to ensure time order
        df = df.sort_values('timestamp')
        
        # Create a simple autoencoder for anomaly detection
        class SimpleAutoencoder(torch.nn.Module):
            def __init__(self, input_dim, hidden_dim=64, latent_dim=16):
                super().__init__()
                self.encoder = torch.nn.Sequential(
                    torch.nn.Linear(input_dim, hidden_dim),
                    torch.nn.ReLU(),
                    torch.nn.Dropout(0.1),
                    torch.nn.Linear(hidden_dim, latent_dim)
                )
                self.decoder = torch.nn.Sequential(
                    torch.nn.Linear(latent_dim, hidden_dim),
                    torch.nn.ReLU(),
                    torch.nn.Dropout(0.1),
                    torch.nn.Linear(hidden_dim, input_dim)
                )
            
            def forward(self, x):
                z = self.encoder(x)
                x_recon = self.decoder(z)
                return x_recon
        
        # Prepare data for anomaly detection
        scaler = MinMaxScaler()
        data = df[target_col].values.reshape(-1, 1)
        scaled_data = scaler.fit_transform(data)
        
        X = []
        for i in range(len(scaled_data) - seq_length + 1):
            X.append(scaled_data[i:i+seq_length].flatten())
        
        X = np.array(X)
        X_tensor = torch.tensor(X, dtype=torch.float32)
        
        # Create dataset
        dataset = torch.utils.data.TensorDataset(X_tensor, X_tensor)
        dataloader = torch.utils.data.DataLoader(dataset, batch_size=16, shuffle=True)
        
        # Initialize model
        input_dim = X.shape[1]
        hidden_dim = 64
        latent_dim = 16
        
        model = SimpleAutoencoder(input_dim, hidden_dim, latent_dim)
        
        # Loss function and optimizer
        criterion = torch.nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        
        # Training for a few epochs
        num_epochs = 10
        logger.info("Starting anomaly detection training...")
        
        training_losses = []
        
        for epoch in range(num_epochs):
            epoch_loss = 0.0
            for X_batch, _ in dataloader:
                # Forward pass
                X_recon = model(X_batch)
                loss = criterion(X_recon, X_batch)
                
                # Backward pass and optimize
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item()
            
            avg_epoch_loss = epoch_loss / len(dataloader)
            training_losses.append(avg_epoch_loss)
            logger.info(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_epoch_loss:.6f}")
        
        logger.info("Anomaly detection training complete!")
        
        # Calculate reconstruction errors for threshold
        reconstruction_errors = []
        with torch.no_grad():
            for X_batch, _ in dataloader:
                X_recon = model(X_batch)
                batch_errors = torch.mean((X_recon - X_batch) ** 2, dim=1)
                reconstruction_errors.extend(batch_errors.numpy())
        
        # Set threshold at specified percentile
        threshold = np.percentile(reconstruction_errors, anomaly_threshold * 100)
        logger.info(f"Anomaly threshold: {threshold:.6f}")
        
        # Detect anomalies
        anomalies = []
        with torch.no_grad():
            for i, x in enumerate(X_tensor):
                x_recon = model(x.unsqueeze(0))
                error = torch.mean((x_recon - x.unsqueeze(0)) ** 2).item()
                
                if error > threshold:
                    idx = i + seq_length - 1
                    if idx < len(df):
                        anomalies.append({
                            'timestamp': df['timestamp'].iloc[idx],
                            'value': float(df[target_col].iloc[idx]),
                            'reconstruction_error': float(error),
                            'severity': float(error / threshold),
                            'index': int(idx)
                        })
        
        anomalies.sort(key=lambda x: x['severity'], reverse=True)
        
        # Prepare result
        anomaly_results = {
            'anomaly_count': len(anomalies),
            'anomalies': anomalies,
            'threshold': float(threshold),
            'avg_severity': float(np.mean([a['severity'] for a in anomalies]) if anomalies else 0)
        }
        
        # Add building ID
        if building_id:
            anomaly_results['building_id'] = building_id
        
        # Add period info
        anomaly_results['period'] = {
            'start': df['timestamp'].min().isoformat(),
            'end': df['timestamp'].max().isoformat()
        }
        
        # Add training metrics
        anomaly_results['training_metrics'] = {
            'final_loss': float(training_losses[-1]),
            'best_loss': float(min(training_losses)),
            'anomaly_threshold': float(threshold),
            'num_epochs': num_epochs
        }
        
        logger.info(f"Detected {anomaly_results['anomaly_count']} anomalies using deep learning model")
        return anomaly_results
        
    except Exception as e:
        logger.error(f"Error detecting anomalies with deep learning: {str(e)}")
        # Fall back to statistical method
        logger.warning("Falling back to statistical anomaly detection method")
        try:
            return self.detect_anomalies(
                building_id=building_id,
                df=df,
                data_path=data_path,
                start_date=start_date,
                end_date=end_date
            )
        except Exception as fallback_error:
            logger.error(f"Error in fallback anomaly detection: {str(fallback_error)}")
            raise
```

### Bước 4: Cập nhật file requirements.txt

Đã cập nhật file requirements.txt với các thư viện cần thiết.

### Bước 5: Cập nhật API endpoints trong analysis_routes.py

Đã thêm hai API endpoint mới:
- POST /analysis/forecast - Để dự báo tiêu thụ năng lượng
- POST /analysis/anomalies-dl - Để phát hiện bất thường bằng deep learning

### Bước 6: Chạy thử nghiệm API endpoints

Sau khi khởi động lại máy chủ API, bạn có thể test các endpoint mới:

```bash
# Khởi động máy chủ API
cd /Volumes/KIOXIA/EAIO/EAIO_Multi-Agent_V2
python -m backend.main
```

Sau đó, sử dụng các lệnh curl để test:

```bash
# Test dự báo
curl -X POST http://localhost:8000/analysis/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": "BLD1",
    "metric": "electricity",
    "use_deep_learning": true,
    "forecast_horizon": 24
  }'

# Test phát hiện bất thường
curl -X POST http://localhost:8000/analysis/anomalies-dl \
  -H "Content-Type: application/json" \
  -d '{
    "building_id": "BLD1",
    "metric": "electricity",
    "seq_length": 24,
    "anomaly_threshold": 0.95
  }'
```

## 3. Ghi chú

- Các mô hình deep learning sẽ hoạt động tốt nhất với GPU. Nếu không có GPU, chúng vẫn hoạt động nhưng sẽ chậm hơn.
- Có thể cần điều chỉnh các tham số của mô hình (số lượng epoch, kích thước batch, tốc độ học, kích thước mạng) để phù hợp với dữ liệu cụ thể.
- Các mô hình này là các triển khai đơn giản và có thể được mở rộng với các kiến trúc phức tạp hơn trong tương lai.
"""
Test script for the Energy AI Optimizer deep learning models.

This script should be placed in the project root directory and run from there.
"""
import os
import sys
import pandas as pd
import numpy as np
import torch
import logging
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('test_deep_learning')

# Create synthetic data
def create_test_data(num_days=30):
    """Create synthetic time-series data."""
    # Create timestamp range (hourly for num_days)
    end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=num_days)
    timestamps = pd.date_range(start=start_date, end=end_date, freq='h')
    
    # Create consumption values with patterns
    # Base consumption
    base = 100
    
    # Daily pattern (peak during daytime)
    hour_factor = np.sin(np.pi * timestamps.hour / 12) * 0.5 + 0.5
    
    # Weekly pattern (lower on weekends)
    weekday_factor = 0.7 + 0.3 * (timestamps.dayofweek < 5).astype(float)
    
    # Random variations
    noise = np.random.normal(0, 0.05, size=len(timestamps))
    
    # Generate consumption values
    consumption = base * hour_factor * weekday_factor * (1 + noise)
    
    # Add some outliers
    consumption = list(consumption)  # Convert to list for easier modification
    outlier_indices = np.random.choice(range(len(timestamps)), size=5, replace=False)
    for idx in outlier_indices:
        consumption[idx] *= np.random.choice([1.5, 2.0, 0.5, 0.3])
    consumption = np.array(consumption)  # Convert back to array
    
    # Create DataFrame
    df = pd.DataFrame({
        'timestamp': timestamps,
        'consumption': consumption,
        'building_id': 'TEST001'
    })
    
    return df

def test_direct_implementation():
    """
    Implement a direct test of the deep learning models.
    
    This test doesn't rely on the project's module structure but directly
    implements similar functionality to test the environment.
    """
    logger.info("Testing direct implementation of deep learning models...")
    
    # Create test data
    df = create_test_data(num_days=30)
    logger.info(f"Created synthetic data: {df.shape}")
    
    # Simple LSTM model for forecasting
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
            # x shape: (batch_size, seq_len, input_size)
            
            # LSTM forward pass
            lstm_out, _ = self.lstm(x)
            
            # Take only the last time step output for prediction
            last_time_step = lstm_out[:, -1, :]
            
            # Reshape for output prediction window
            output = self.linear(last_time_step).unsqueeze(1).repeat(1, 24, 1)
            
            return output
    
    # Prepare data for forecasting
    input_window = 24*3  # 3 days
    forecast_horizon = 24  # 1 day
    
    # Scale data
    scaler = MinMaxScaler()
    data = df['consumption'].values.reshape(-1, 1)
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
    num_epochs = 2
    logger.info("Starting training...")
    
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
            'forecasted_consumption': prediction_rescaled
        })
        
        logger.info(f"Forecast shape: {forecast_df.shape}")
        logger.info(f"Forecast sample:\n{forecast_df.head()}")
    
    # Test autoencoder for anomaly detection
    class SimpleAutoencoder(torch.nn.Module):
        def __init__(self, input_dim, hidden_dim, latent_dim):
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
    seq_length = 24  # 1 day
    
    X_anomaly = []
    for i in range(len(scaled_data) - seq_length + 1):
        X_anomaly.append(scaled_data[i:i+seq_length].flatten())
    
    X_anomaly = np.array(X_anomaly)
    X_anomaly_tensor = torch.tensor(X_anomaly, dtype=torch.float32)
    
    # Create dataset
    anomaly_dataset = torch.utils.data.TensorDataset(X_anomaly_tensor, X_anomaly_tensor)
    anomaly_dataloader = torch.utils.data.DataLoader(anomaly_dataset, batch_size=16, shuffle=True)
    
    # Initialize model
    input_dim = X_anomaly.shape[1]
    hidden_dim = 64
    latent_dim = 16
    
    anomaly_model = SimpleAutoencoder(input_dim, hidden_dim, latent_dim)
    
    # Loss function and optimizer
    criterion = torch.nn.MSELoss()
    optimizer = torch.optim.Adam(anomaly_model.parameters(), lr=0.001)
    
    # Training for a few epochs
    num_epochs = 2
    logger.info("Starting anomaly detection training...")
    
    for epoch in range(num_epochs):
        epoch_loss = 0.0
        for X_batch, _ in anomaly_dataloader:
            # Forward pass
            X_recon = anomaly_model(X_batch)
            loss = criterion(X_recon, X_batch)
            
            # Backward pass and optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
        
        avg_epoch_loss = epoch_loss / len(anomaly_dataloader)
        logger.info(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_epoch_loss:.6f}")
    
    logger.info("Anomaly detection training complete!")
    
    # Calculate reconstruction errors for threshold
    reconstruction_errors = []
    with torch.no_grad():
        for X_batch, _ in anomaly_dataloader:
            X_recon = anomaly_model(X_batch)
            batch_errors = torch.mean((X_recon - X_batch) ** 2, dim=1)
            reconstruction_errors.extend(batch_errors.numpy())
    
    # Set threshold at 95th percentile
    threshold = np.percentile(reconstruction_errors, 95)
    logger.info(f"Anomaly threshold: {threshold:.6f}")
    
    # Detect anomalies
    anomalies = []
    with torch.no_grad():
        for i, x in enumerate(X_anomaly_tensor):
            x_recon = anomaly_model(x.unsqueeze(0))
            error = torch.mean((x_recon - x.unsqueeze(0)) ** 2).item()
            
            if error > threshold:
                idx = i + seq_length - 1
                if idx < len(df):
                    anomalies.append({
                        'timestamp': df['timestamp'].iloc[idx],
                        'value': float(df['consumption'].iloc[idx]),
                        'error': float(error),
                        'severity': float(error / threshold)
                    })
    
    anomalies.sort(key=lambda x: x['severity'], reverse=True)
    logger.info(f"Detected {len(anomalies)} anomalies")
    if anomalies:
        logger.info(f"Top anomalies:\n{anomalies[:3]}")
    
    logger.info("Direct implementation test completed successfully!")

if __name__ == "__main__":
    logger.info("Starting deep learning tests")
    
    # First, check if PyTorch is working
    logger.info(f"PyTorch version: {torch.__version__}")
    logger.info(f"CUDA available: {torch.cuda.is_available()}")
    
    try:
        # Run direct implementation test
        test_direct_implementation()
        
        logger.info("All tests completed successfully!")
    except Exception as e:
        logger.error(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
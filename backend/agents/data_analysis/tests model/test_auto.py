"""
Simple test for PyTorch autoencoder
"""
import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler

# Create synthetic data
def create_test_data(num_days=30):
    """Create synthetic time-series data."""
    # Create timestamp range (hourly for num_days)
    end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=num_days)
    timestamps = pd.date_range(start=start_date, end=end_date, freq='H')
    
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
        'consumption': consumption
    })
    
    return df

# Simple autoencoder model
class SimpleAutoencoder(nn.Module):
    def __init__(self, input_dim, hidden_dim):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim // 2)
        )
        self.decoder = nn.Sequential(
            nn.Linear(hidden_dim // 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim)
        )
    
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

# Main test
if __name__ == "__main__":
    print("Testing simple autoencoder with PyTorch")
    
    # Check if CUDA is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Create test data
    df = create_test_data(num_days=30)
    print(f"Created synthetic data: {df.shape}")
    
    # Prepare data for autoencoder
    seq_length = 24  # 24 hours
    scaler = MinMaxScaler()
    
    # Scale data
    scaled_data = scaler.fit_transform(df['consumption'].values.reshape(-1, 1))
    
    # Create sequences
    X = []
    for i in range(len(scaled_data) - seq_length + 1):
        X.append(scaled_data[i:i+seq_length].flatten())
    
    X = np.array(X)
    X_tensor = torch.tensor(X, dtype=torch.float32).to(device)
    
    print(f"Prepared sequences: {X.shape}")
    
    # Create and train model
    input_dim = seq_length
    hidden_dim = 64
    model = SimpleAutoencoder(input_dim, hidden_dim).to(device)
    
    # Loss and optimizer
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Training
    num_epochs = 2
    batch_size = 32
    
    print("Starting training...")
    
    for epoch in range(num_epochs):
        for i in range(0, len(X_tensor), batch_size):
            batch = X_tensor[i:i+batch_size]
            
            # Forward pass
            outputs = model(batch)
            loss = criterion(outputs, batch)
            
            # Backward and optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        
        print(f"Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}")
    
    print("Training completed!")
    
    # Test reconstruction
    with torch.no_grad():
        test_sample = X_tensor[:5]
        reconstructed = model(test_sample)
        
        # Calculate reconstruction error
        mse = ((reconstructed - test_sample) ** 2).mean(dim=1)
        print(f"Reconstruction errors: {mse.cpu().numpy()}")
    
    print("Test completed successfully!")
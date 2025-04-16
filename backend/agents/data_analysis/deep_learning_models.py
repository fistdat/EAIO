"""
Deep Learning Models for Energy Data Analysis.

This module contains deep learning models for time-series forecasting and anomaly detection
in energy consumption data.
"""
from typing import Dict, List, Optional, Any, Tuple, Union
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from sklearn.preprocessing import MinMaxScaler
import logging

# Get logger
logger = logging.getLogger('eaio.agent.data_analysis.models')

# Define constant to check if deep learning is available
DEEP_LEARNING_AVAILABLE = True

class TimeSeriesDataset(Dataset):
    """PyTorch Dataset for time series data."""
    
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)
        
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

class Autoformer(nn.Module):
    """
    Autoformer model for time-series forecasting.
    A simplified version of the Autoformer architecture for energy data forecasting.
    """
    
    def __init__(
        self,
        input_dim: int,
        hidden_dim: int,
        output_dim: int,
        num_layers: int = 2,
        dropout: float = 0.1
    ):
        """
        Initialize Autoformer model.
        
        Args:
            input_dim: Number of input features
            hidden_dim: Size of hidden layers
            output_dim: Number of output features
            num_layers: Number of transformer layers
            dropout: Dropout rate
        """
        super().__init__()
        
        self.input_projection = nn.Linear(input_dim, hidden_dim)
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=4,  # Number of attention heads
            dim_feedforward=hidden_dim*4,
            dropout=dropout,
            activation='gelu',
            batch_first=True
        )
        
        self.encoder = nn.TransformerEncoder(
            encoder_layer=encoder_layer,
            num_layers=num_layers
        )
        
        self.output_projection = nn.Linear(hidden_dim, output_dim)
        
        logger.info(f"Initialized Autoformer with input_dim={input_dim}, hidden_dim={hidden_dim}, output_dim={output_dim}")
    
    def forward(self, x, mask=None):
        """Forward pass through the model."""
        # Project input to hidden dimension
        x = self.input_projection(x)
        
        # Pass through transformer encoder
        x = self.encoder(x, src_key_padding_mask=mask)
        
        # Project to output dimension
        output = self.output_projection(x)
        
        return output
    
    def create_mask(self, x):
        """Create padding mask for transformer."""
        # Create mask for zero padded values (if needed)
        return torch.isnan(x).any(dim=-1)

class EnergyForecaster:
    """Class to handle energy consumption forecasting using the Autoformer model."""
    
    def __init__(
        self,
        input_window: int = 24*7,  # Default: one week of hourly data
        forecast_horizon: int = 24,  # Default: forecast next 24 hours
        hidden_dim: int = 128,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        num_epochs: int = 30,
        device: str = "cuda" if torch.cuda.is_available() else "cpu"
    ):
        """
        Initialize the forecaster.
        
        Args:
            input_window: Number of timesteps to use as input
            forecast_horizon: Number of timesteps to forecast
            hidden_dim: Size of hidden layers in the model
            learning_rate: Learning rate for optimizer
            batch_size: Batch size for training
            num_epochs: Number of training epochs
            device: Device to run the model on ('cuda' or 'cpu')
        """
        self.input_window = input_window
        self.forecast_horizon = forecast_horizon
        self.hidden_dim = hidden_dim
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.num_epochs = num_epochs
        self.device = device
        
        self.model = None
        self.scaler = MinMaxScaler()
        
        logger.info(f"Initialized EnergyForecaster with input_window={input_window}, "
                   f"forecast_horizon={forecast_horizon}, device={device}")
    
    def _prepare_data(self, df: pd.DataFrame, target_col: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare time series data for training.
        
        Args:
            df: DataFrame with time series data
            target_col: Column name of target variable
            
        Returns:
            X: Input sequences (scaled)
            y: Target sequences (scaled)
        """
        # Extract target data and scale
        data = df[target_col].values.reshape(-1, 1)
        scaled_data = self.scaler.fit_transform(data)
        
        X, y = [], []
        
        # Create sequences
        for i in range(len(scaled_data) - self.input_window - self.forecast_horizon + 1):
            X.append(scaled_data[i:i+self.input_window])
            y.append(scaled_data[i+self.input_window:i+self.input_window+self.forecast_horizon])
        
        return np.array(X), np.array(y)
    
    def train(self, df: pd.DataFrame, target_col: str) -> Dict[str, float]:
        """
        Train the Autoformer model on energy data.
        
        Args:
            df: DataFrame with time series data
            target_col: Column name of target variable
            
        Returns:
            Dict with training metrics
        """
        X, y = self._prepare_data(df, target_col)
        
        # Create dataset and dataloader
        dataset = TimeSeriesDataset(X, y)
        dataloader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)
        
        # Initialize model
        input_dim = X.shape[2]  # Features dimension
        output_dim = y.shape[2]  # Output dimension
        
        self.model = Autoformer(
            input_dim=input_dim,
            hidden_dim=self.hidden_dim,
            output_dim=output_dim
        ).to(self.device)
        
        # Initialize optimizer and loss function
        optimizer = optim.Adam(self.model.parameters(), lr=self.learning_rate)
        criterion = nn.MSELoss()
        
        # Training loop
        logger.info(f"Starting training for {self.num_epochs} epochs")
        self.model.train()
        
        training_losses = []
        best_loss = float('inf')
        
        for epoch in range(self.num_epochs):
            epoch_loss = 0.0
            for X_batch, y_batch in dataloader:
                X_batch = X_batch.to(self.device)
                y_batch = y_batch.to(self.device)
                
                # Forward pass
                y_pred = self.model(X_batch)
                loss = criterion(y_pred, y_batch)
                
                # Backward pass and optimize
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item()
            
            avg_epoch_loss = epoch_loss / len(dataloader)
            training_losses.append(avg_epoch_loss)
            
            if avg_epoch_loss < best_loss:
                best_loss = avg_epoch_loss
            
            logger.info(f"Epoch {epoch+1}/{self.num_epochs}, Loss: {avg_epoch_loss:.6f}")
        
        logger.info(f"Training complete. Best loss: {best_loss:.6f}")
        
        return {
            "final_loss": training_losses[-1],
            "best_loss": best_loss,
            "num_epochs": self.num_epochs
        }
    
    def predict(self, df: pd.DataFrame, target_col: str) -> pd.DataFrame:
        """
        Generate forecasts using the trained model.
        
        Args:
            df: DataFrame with latest time series data
            target_col: Column name of target variable
            
        Returns:
            DataFrame with forecasted values
        """
        if self.model is None:
            raise ValueError("Model must be trained before prediction")
        
        # Extract and scale latest data for prediction
        latest_data = df[target_col].values[-self.input_window:].reshape(-1, 1)
        scaled_data = self.scaler.transform(latest_data)
        
        # Convert to tensor and add batch dimension
        X = torch.tensor(scaled_data, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        # Generate prediction
        self.model.eval()
        with torch.no_grad():
            prediction = self.model(X)
        
        # Convert back to numpy and rescale
        prediction_np = prediction.cpu().numpy().squeeze()
        prediction_rescaled = self.scaler.inverse_transform(prediction_np.reshape(-1, 1)).reshape(-1)
        
        # Create DataFrame with forecasted values
        last_timestamp = df['timestamp'].iloc[-1]
        forecast_index = pd.date_range(
            start=last_timestamp + pd.Timedelta(hours=1),
            periods=self.forecast_horizon,
            freq='H'
        )
        
        forecast_df = pd.DataFrame({
            'timestamp': forecast_index,
            f'forecasted_{target_col}': prediction_rescaled
        })
        
        logger.info(f"Generated forecast for {self.forecast_horizon} timesteps")
        return forecast_df


class Autoencoder(nn.Module):
    """Autoencoder model for anomaly detection in energy data."""
    
    def __init__(
        self,
        input_dim: int,
        hidden_dims: List[int],
        latent_dim: int,
        dropout: float = 0.1
    ):
        """
        Initialize Autoencoder model.
        
        Args:
            input_dim: Input dimension
            hidden_dims: List of hidden dimensions for encoder
            latent_dim: Dimension of latent space
            dropout: Dropout rate
        """
        super().__init__()
        
        # Build encoder
        encoder_layers = []
        
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            encoder_layers.append(nn.Linear(prev_dim, hidden_dim))
            encoder_layers.append(nn.ReLU())
            encoder_layers.append(nn.Dropout(dropout))
            prev_dim = hidden_dim
            
        encoder_layers.append(nn.Linear(prev_dim, latent_dim))
        self.encoder = nn.Sequential(*encoder_layers)
        
        # Build decoder
        decoder_layers = []
        
        prev_dim = latent_dim
        for hidden_dim in reversed(hidden_dims):
            decoder_layers.append(nn.Linear(prev_dim, hidden_dim))
            decoder_layers.append(nn.ReLU())
            decoder_layers.append(nn.Dropout(dropout))
            prev_dim = hidden_dim
        
        decoder_layers.append(nn.Linear(prev_dim, input_dim))
        self.decoder = nn.Sequential(*decoder_layers)
        
        logger.info(f"Initialized Autoencoder with input_dim={input_dim}, "
                   f"hidden_dims={hidden_dims}, latent_dim={latent_dim}")
    
    def forward(self, x):
        """Forward pass through the model."""
        # Encode
        z = self.encoder(x)
        # Decode
        x_recon = self.decoder(z)
        return x_recon, z
    
    def encode(self, x):
        """Encode input to latent representation."""
        return self.encoder(x)
    
    def decode(self, z):
        """Decode latent representation to input space."""
        return self.decoder(z)


class AnomalyDetector:
    """Class for anomaly detection in energy data using Autoencoder."""
    
    def __init__(
        self,
        seq_length: int = 24,  # Default: use 24 hours of data
        hidden_dims: List[int] = [128, 64],
        latent_dim: int = 32,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        num_epochs: int = 30,
        anomaly_threshold: float = 0.95,  # Percentile for anomaly threshold
        device: str = "cuda" if torch.cuda.is_available() else "cpu"
    ):
        """
        Initialize the anomaly detector.
        
        Args:
            seq_length: Length of input sequence
            hidden_dims: List of hidden dimensions for autoencoder
            latent_dim: Dimension of latent space
            learning_rate: Learning rate for optimizer
            batch_size: Batch size for training
            num_epochs: Number of training epochs
            anomaly_threshold: Percentile for anomaly threshold
            device: Device to run the model on ('cuda' or 'cpu')
        """
        self.seq_length = seq_length
        self.hidden_dims = hidden_dims
        self.latent_dim = latent_dim
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.num_epochs = num_epochs
        self.anomaly_threshold = anomaly_threshold
        self.device = device
        
        self.model = None
        self.scaler = MinMaxScaler()
        self.threshold = None
        
        logger.info(f"Initialized AnomalyDetector with seq_length={seq_length}, "
                   f"latent_dim={latent_dim}, device={device}")
    
    def _prepare_data(self, df: pd.DataFrame, target_col: str) -> np.ndarray:
        """
        Prepare time series data for anomaly detection.
        
        Args:
            df: DataFrame with time series data
            target_col: Column name of target variable
            
        Returns:
            X: Sequences for training
        """
        # Extract target data and scale
        data = df[target_col].values.reshape(-1, 1)
        scaled_data = self.scaler.fit_transform(data)
        
        X = []
        
        # Create sequences
        for i in range(len(scaled_data) - self.seq_length + 1):
            X.append(scaled_data[i:i+self.seq_length].flatten())
        
        return np.array(X)
    
    def train(self, df: pd.DataFrame, target_col: str) -> Dict[str, float]:
        """
        Train the Autoencoder model on energy data.
        
        Args:
            df: DataFrame with time series data
            target_col: Column name of target variable
            
        Returns:
            Dict with training metrics
        """
        X = self._prepare_data(df, target_col)
        
        # Create dataset and dataloader
        X_tensor = torch.tensor(X, dtype=torch.float32)
        dataset = torch.utils.data.TensorDataset(X_tensor, X_tensor)
        dataloader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)
        
        # Initialize model
        input_dim = X.shape[1]  # Flattened sequence length
        
        self.model = Autoencoder(
            input_dim=input_dim,
            hidden_dims=self.hidden_dims,
            latent_dim=self.latent_dim
        ).to(self.device)
        
        # Initialize optimizer and loss function
        optimizer = optim.Adam(self.model.parameters(), lr=self.learning_rate)
        criterion = nn.MSELoss()
        
        # Training loop
        logger.info(f"Starting training for {self.num_epochs} epochs")
        self.model.train()
        
        training_losses = []
        best_loss = float('inf')
        
        for epoch in range(self.num_epochs):
            epoch_loss = 0.0
            for X_batch, _ in dataloader:
                X_batch = X_batch.to(self.device)
                
                # Forward pass
                X_recon, _ = self.model(X_batch)
                loss = criterion(X_recon, X_batch)
                
                # Backward pass and optimize
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item()
            
            avg_epoch_loss = epoch_loss / len(dataloader)
            training_losses.append(avg_epoch_loss)
            
            if avg_epoch_loss < best_loss:
                best_loss = avg_epoch_loss
            
            logger.info(f"Epoch {epoch+1}/{self.num_epochs}, Loss: {avg_epoch_loss:.6f}")
        
        # Calculate reconstruction errors for threshold
        self.model.eval()
        reconstruction_errors = []
        
        with torch.no_grad():
            for X_batch, _ in dataloader:
                X_batch = X_batch.to(self.device)
                X_recon, _ = self.model(X_batch)
                
                # Calculate reconstruction error (MSE)
                batch_errors = torch.mean((X_recon - X_batch) ** 2, dim=1)
                reconstruction_errors.extend(batch_errors.cpu().numpy())
        
        # Set threshold at specified percentile
        self.threshold = np.percentile(reconstruction_errors, self.anomaly_threshold * 100)
        
        logger.info(f"Training complete. Best loss: {best_loss:.6f}, Anomaly threshold: {self.threshold:.6f}")
        
        return {
            "final_loss": training_losses[-1],
            "best_loss": best_loss,
            "anomaly_threshold": float(self.threshold),
            "num_epochs": self.num_epochs
        }
    
    def detect_anomalies(self, df: pd.DataFrame, target_col: str) -> Dict[str, Any]:
        """
        Detect anomalies in energy consumption data.
        
        Args:
            df: DataFrame with time series data
            target_col: Column name of target variable
            
        Returns:
            Dict with anomaly detection results
        """
        if self.model is None or self.threshold is None:
            raise ValueError("Model must be trained before anomaly detection")
        
        # Prepare data
        X = self._prepare_data(df, target_col)
        X_tensor = torch.tensor(X, dtype=torch.float32).to(self.device)
        
        # Detect anomalies
        self.model.eval()
        anomalies = []
        
        with torch.no_grad():
            batch_size = 128  # Process in batches to avoid OOM
            
            for i in range(0, len(X_tensor), batch_size):
                batch = X_tensor[i:i+batch_size]
                
                # Reconstruct
                reconstructions, _ = self.model(batch)
                
                # Calculate reconstruction error
                errors = torch.mean((reconstructions - batch) ** 2, dim=1).cpu().numpy()
                
                # Find anomalies where error exceeds threshold
                for j, error in enumerate(errors):
                    if error > self.threshold:
                        # Index in original DataFrame
                        idx = i + j + self.seq_length - 1
                        if idx < len(df):
                            anomalies.append({
                                'timestamp': df['timestamp'].iloc[idx],
                                'value': float(df[target_col].iloc[idx]),
                                'reconstruction_error': float(error),
                                'severity': float(error / self.threshold),
                                'index': int(idx)
                            })
        
        anomalies.sort(key=lambda x: x['severity'], reverse=True)
        
        logger.info(f"Detected {len(anomalies)} anomalies in {len(df)} data points")
        
        return {
            'anomaly_count': len(anomalies),
            'anomalies': anomalies,
            'threshold': float(self.threshold),
            'avg_severity': np.mean([a['severity'] for a in anomalies]) if anomalies else 0
        }
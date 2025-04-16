"""
Test script for the deep learning models in the Energy AI Optimizer.
"""
import os
import sys
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('test_deep_learning')

# Add the project root to the path so we can import modules
project_root = "/Volumes/KIOXIA/EAIO/EAIO_Multi-Agent_V2"
sys.path.insert(0, project_root)

# Check if path exists
if not os.path.exists(project_root):
    logger.error(f"Project root path does not exist: {project_root}")
    sys.exit(1)
else:
    logger.info(f"Project root path found: {project_root}")
    
# Check if module directory exists
module_path = os.path.join(project_root, 'backend', 'agents', 'data_analysis')
if not os.path.exists(module_path):
    logger.error(f"Module path does not exist: {module_path}")
    sys.exit(1)
else:
    logger.info(f"Module path found: {module_path}")

# Import the deep learning modules
try:
    # Attempt with backend prefix
    from backend.agents.data_analysis.deep_learning_models import (
        EnergyForecaster, AnomalyDetector, DEEP_LEARNING_AVAILABLE
    )
    logger.info("Successfully imported deep learning models with backend.agents prefix")
except ImportError:
    try:
        # Try without backend prefix
        from agents.data_analysis.deep_learning_models import (
            EnergyForecaster, AnomalyDetector, DEEP_LEARNING_AVAILABLE
        )
        logger.info("Successfully imported deep learning models with agents prefix")
    except ImportError as e:
        logger.error(f"Import error: {e}")
        logger.error("Make sure you're running this script from the project root or add the project root to PYTHONPATH")
        sys.exit(1)

def create_test_data(num_days=30):
    """
    Create synthetic test data for energy consumption.
    """
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
    outlier_indices = np.random.choice(range(len(timestamps)), size=5, replace=False)
    consumption[outlier_indices] *= np.random.choice([1.5, 2.0, 0.5, 0.3], size=5)
    
    # Create DataFrame
    df = pd.DataFrame({
        'timestamp': timestamps,
        'consumption': consumption,
        'building_id': 'TEST001'
    })
    
    return df

def test_energy_forecaster():
    """
    Test the EnergyForecaster class directly.
    """
    logger.info("Testing EnergyForecaster...")
    
    # Create test data
    df = create_test_data(num_days=30)
    
    # Initialize forecaster
    forecaster = EnergyForecaster(
        input_window=24*3,  # 3 days
        forecast_horizon=24,  # 1 day
        num_epochs=2  # Reduce epochs for faster testing
    )
    
    # Train the model
    logger.info("Training forecaster model...")
    training_metrics = forecaster.train(df, 'consumption')
    
    # Generate forecast
    logger.info("Generating forecast...")
    forecast_df = forecaster.predict(df, 'consumption')
    
    # Print results
    logger.info(f"Training metrics: {training_metrics}")
    logger.info(f"Forecast shape: {forecast_df.shape}")
    logger.info(f"Forecast sample:\n{forecast_df.head()}")
    
    return forecast_df

def test_anomaly_detector():
    """
    Test the AnomalyDetector class directly.
    """
    logger.info("Testing AnomalyDetector...")
    
    # Create test data
    df = create_test_data(num_days=30)
    
    # Initialize detector
    detector = AnomalyDetector(
        seq_length=24,  # 1 day
        num_epochs=2  # Reduce epochs for faster testing
    )
    
    # Train the model
    logger.info("Training anomaly detector model...")
    train_df = df.iloc[:int(len(df)*0.7)]  # Use 70% for training
    training_metrics = detector.train(train_df, 'consumption')
    
    # Detect anomalies
    logger.info("Detecting anomalies...")
    anomaly_results = detector.detect_anomalies(df, 'consumption')
    
    # Print results
    logger.info(f"Training metrics: {training_metrics}")
    logger.info(f"Detected {anomaly_results['anomaly_count']} anomalies")
    if anomaly_results['anomaly_count'] > 0:
        logger.info(f"Top 3 anomalies:\n{anomaly_results['anomalies'][:3]}")
    
    return anomaly_results

if __name__ == "__main__":
    logger.info("Starting deep learning models test")
    
    if not DEEP_LEARNING_AVAILABLE:
        logger.error("Deep learning models are not available. Make sure PyTorch is installed.")
        sys.exit(1)
    
    try:
        # Test individual models
        test_energy_forecaster()
        test_anomaly_detector()
        
        logger.info("All tests completed successfully!")
    except Exception as e:
        logger.error(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
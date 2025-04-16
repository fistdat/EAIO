"""
Utility functions for data processing in Energy AI Optimizer.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Union, List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def preprocess_time_series(
    df: pd.DataFrame, 
    target_column: str = 'value',
    timestamp_column: str = 'timestamp',
    fill_missing: bool = True,
    normalize: bool = False
) -> pd.DataFrame:
    """
    Tiền xử lý dữ liệu chuỗi thời gian cho mô hình dự báo.
    
    Args:
        df: DataFrame chứa dữ liệu chuỗi thời gian
        target_column: Tên cột giá trị cần dự báo
        timestamp_column: Tên cột thời gian
        fill_missing: Có điền giá trị thiếu hay không
        normalize: Có chuẩn hóa dữ liệu hay không
        
    Returns:
        DataFrame đã xử lý
    """
    try:
        # Tạo bản sao để tránh thay đổi dữ liệu gốc
        processed_df = df.copy()
        
        # Chuyển đổi cột timestamp thành đối tượng datetime
        if timestamp_column in processed_df.columns:
            processed_df[timestamp_column] = pd.to_datetime(processed_df[timestamp_column])
            processed_df = processed_df.sort_values(by=timestamp_column)
        
        # Kiểm tra và xử lý giá trị thiếu
        if fill_missing and target_column in processed_df.columns:
            if processed_df[target_column].isna().any():
                logger.info(f"Filling {processed_df[target_column].isna().sum()} missing values")
                # Sử dụng phương pháp interpolate để điền giá trị thiếu
                processed_df[target_column] = processed_df[target_column].interpolate(method='linear')
                # Điền giá trị thiếu ở đầu và cuối (nếu có)
                processed_df[target_column] = processed_df[target_column].fillna(method='bfill').fillna(method='ffill')
        
        # Xử lý outliers (giá trị ngoại lai) bằng cách áp dụng giới hạn IQR
        if target_column in processed_df.columns:
            q1 = processed_df[target_column].quantile(0.25)
            q3 = processed_df[target_column].quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            # Đánh dấu outliers
            outliers = ((processed_df[target_column] < lower_bound) | 
                        (processed_df[target_column] > upper_bound))
            
            if outliers.any():
                logger.info(f"Detected {outliers.sum()} outliers")
                # Có thể thay thế outliers bằng giới hạn
                # processed_df.loc[processed_df[target_column] < lower_bound, target_column] = lower_bound
                # processed_df.loc[processed_df[target_column] > upper_bound, target_column] = upper_bound
        
        # Chuẩn hóa dữ liệu nếu cần
        if normalize and target_column in processed_df.columns:
            logger.info("Normalizing target column")
            min_val = processed_df[target_column].min()
            max_val = processed_df[target_column].max()
            
            if max_val > min_val:
                processed_df[f"{target_column}_normalized"] = (processed_df[target_column] - min_val) / (max_val - min_val)
            else:
                processed_df[f"{target_column}_normalized"] = 0
                
            # Lưu giá trị min/max để denormalize sau này
            processed_df.attrs['min_val'] = min_val
            processed_df.attrs['max_val'] = max_val
        
        # Thêm các đặc trưng thời gian nếu có cột timestamp
        if timestamp_column in processed_df.columns:
            # Thêm đặc trưng ngày trong tuần
            processed_df['day_of_week'] = processed_df[timestamp_column].dt.dayofweek
            
            # Thêm đặc trưng giờ trong ngày
            processed_df['hour_of_day'] = processed_df[timestamp_column].dt.hour
            
            # Thêm đặc trưng ngày trong tháng
            processed_df['day_of_month'] = processed_df[timestamp_column].dt.day
            
            # Thêm đặc trưng tháng trong năm
            processed_df['month_of_year'] = processed_df[timestamp_column].dt.month
            
            # Đánh dấu ngày cuối tuần
            processed_df['is_weekend'] = processed_df['day_of_week'].isin([5, 6]).astype(int)
            
            # Đánh dấu giờ làm việc (8h-17h)
            processed_df['is_business_hour'] = ((processed_df['hour_of_day'] >= 8) & 
                                             (processed_df['hour_of_day'] <= 17)).astype(int)
        
        logger.info("Time series preprocessing completed successfully")
        return processed_df
    
    except Exception as e:
        logger.error(f"Error during time series preprocessing: {str(e)}")
        # Trả về DataFrame gốc nếu có lỗi
        return df

def calculate_energy_metrics(
    consumption_df: pd.DataFrame, 
    timestamp_column: str = 'timestamp',
    value_column: str = 'value'
) -> Dict[str, Any]:
    """
    Tính toán các chỉ số tiêu thụ năng lượng từ dữ liệu.
    
    Args:
        consumption_df: DataFrame chứa dữ liệu tiêu thụ
        timestamp_column: Tên cột thời gian
        value_column: Tên cột giá trị tiêu thụ
        
    Returns:
        Dictionary chứa các chỉ số tiêu thụ
    """
    if consumption_df.empty:
        return {
            'total_consumption': 0,
            'average_daily_consumption': 0,
            'peak_consumption': 0,
            'peak_time': None,
            'min_consumption': 0,
            'min_time': None,
            'weekday_avg': 0,
            'weekend_avg': 0
        }
    
    # Chuyển đổi timestamp thành datetime
    df = consumption_df.copy()
    df[timestamp_column] = pd.to_datetime(df[timestamp_column])
    
    # Tổng tiêu thụ
    total_consumption = df[value_column].sum()
    
    # Tính số ngày duy nhất
    days = df[timestamp_column].dt.date.nunique()
    
    # Tiêu thụ trung bình hàng ngày
    avg_daily = total_consumption / days if days > 0 else 0
    
    # Tìm điểm tiêu thụ cao nhất và thấp nhất
    peak_idx = df[value_column].idxmax()
    min_idx = df[value_column].idxmin()
    
    peak_value = df.loc[peak_idx, value_column]
    peak_time = df.loc[peak_idx, timestamp_column]
    
    min_value = df.loc[min_idx, value_column]
    min_time = df.loc[min_idx, timestamp_column]
    
    # Thêm cột ngày trong tuần và đánh dấu cuối tuần
    df['day_of_week'] = df[timestamp_column].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6])
    
    # Tính trung bình ngày thường và cuối tuần
    weekday_avg = df[~df['is_weekend']][value_column].mean()
    weekend_avg = df[df['is_weekend']][value_column].mean()
    
    return {
        'total_consumption': round(total_consumption, 2),
        'average_daily_consumption': round(avg_daily, 2),
        'peak_consumption': round(peak_value, 2),
        'peak_time': peak_time.isoformat(),
        'min_consumption': round(min_value, 2),
        'min_time': min_time.isoformat(),
        'weekday_avg': round(weekday_avg, 2),
        'weekend_avg': round(weekend_avg, 2)
    }

def detect_anomalies(
    df: pd.DataFrame, 
    value_column: str = 'value',
    timestamp_column: str = 'timestamp',
    method: str = 'iqr',
    threshold: float = 1.5
) -> pd.DataFrame:
    """
    Phát hiện điểm bất thường trong dữ liệu tiêu thụ năng lượng.
    
    Args:
        df: DataFrame chứa dữ liệu tiêu thụ
        value_column: Tên cột giá trị
        timestamp_column: Tên cột thời gian
        method: Phương pháp phát hiện ('iqr', 'zscore', 'moving_avg')
        threshold: Ngưỡng phát hiện
        
    Returns:
        DataFrame với cột anomaly_score và is_anomaly
    """
    result_df = df.copy()
    
    if method == 'iqr':
        # Phương pháp IQR
        q1 = result_df[value_column].quantile(0.25)
        q3 = result_df[value_column].quantile(0.75)
        iqr = q3 - q1
        
        lower_bound = q1 - threshold * iqr
        upper_bound = q3 + threshold * iqr
        
        # Tính điểm bất thường
        result_df['anomaly_score'] = 0
        result_df.loc[result_df[value_column] < lower_bound, 'anomaly_score'] = \
            (lower_bound - result_df[value_column]) / (q1 + 1e-10)
        result_df.loc[result_df[value_column] > upper_bound, 'anomaly_score'] = \
            (result_df[value_column] - upper_bound) / (q3 + 1e-10)
            
        # Đánh dấu điểm bất thường
        result_df['is_anomaly'] = (result_df[value_column] < lower_bound) | \
                                  (result_df[value_column] > upper_bound)
    
    elif method == 'zscore':
        # Phương pháp Z-score
        mean = result_df[value_column].mean()
        std = result_df[value_column].std()
        
        if std > 0:
            result_df['anomaly_score'] = abs((result_df[value_column] - mean) / std)
            result_df['is_anomaly'] = result_df['anomaly_score'] > threshold
        else:
            result_df['anomaly_score'] = 0
            result_df['is_anomaly'] = False
    
    elif method == 'moving_avg':
        # Phương pháp moving average
        window_size = 24  # 24 giờ hoặc 1 ngày
        
        # Tính moving average
        result_df['moving_avg'] = result_df[value_column].rolling(window=window_size, center=True).mean()
        result_df['moving_std'] = result_df[value_column].rolling(window=window_size, center=True).std()
        
        # Điền giá trị NA ở đầu và cuối
        result_df['moving_avg'] = result_df['moving_avg'].fillna(method='bfill').fillna(method='ffill')
        result_df['moving_std'] = result_df['moving_std'].fillna(method='bfill').fillna(method='ffill')
        result_df['moving_std'] = result_df['moving_std'].replace(0, result_df['moving_std'].mean())
        
        # Tính điểm bất thường
        result_df['anomaly_score'] = abs((result_df[value_column] - result_df['moving_avg']) / (result_df['moving_std'] + 1e-10))
        result_df['is_anomaly'] = result_df['anomaly_score'] > threshold
        
        # Xóa các cột tạm thời
        result_df = result_df.drop(['moving_avg', 'moving_std'], axis=1)
    
    else:
        result_df['anomaly_score'] = 0
        result_df['is_anomaly'] = False
    
    return result_df 
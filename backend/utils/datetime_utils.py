"""
Utility functions for datetime handling in Energy AI Optimizer.
"""
from datetime import datetime, timedelta
from typing import Optional, Union, List, Tuple
import pandas as pd
import re

def parse_date_string(date_string: str) -> datetime:
    """
    Chuyển đổi chuỗi ngày tháng sang đối tượng datetime.
    Hỗ trợ nhiều định dạng khác nhau.
    
    Args:
        date_string: Chuỗi ngày tháng cần chuyển đổi
        
    Returns:
        Đối tượng datetime
        
    Raises:
        ValueError: Nếu không thể chuyển đổi chuỗi
    """
    # Thử chuyển đổi chuỗi ISO
    try:
        return pd.to_datetime(date_string)
    except:
        pass
    
    # Thử các định dạng phổ biến khác
    formats = [
        '%Y-%m-%d',          # 2023-04-25
        '%Y/%m/%d',          # 2023/04/25
        '%d-%m-%Y',          # 25-04-2023
        '%d/%m/%Y',          # 25/04/2023
        '%m-%d-%Y',          # 04-25-2023
        '%m/%d/%Y',          # 04/25/2023
        '%Y-%m-%d %H:%M:%S', # 2023-04-25 14:30:00
        '%Y/%m/%d %H:%M:%S', # 2023/04/25 14:30:00
        '%d-%m-%Y %H:%M:%S', # 25-04-2023 14:30:00
        '%d/%m/%Y %H:%M:%S', # 25/04/2023 14:30:00
        '%m-%d-%Y %H:%M:%S', # 04-25-2023 14:30:00
        '%m/%d/%Y %H:%M:%S', # 04/25/2023 14:30:00
        '%Y-%m-%dT%H:%M:%S', # 2023-04-25T14:30:00
        '%Y-%m-%dT%H:%M:%SZ' # 2023-04-25T14:30:00Z
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    # Thử xử lý chuỗi tự nhiên
    try:
        # 'yesterday', 'today', 'tomorrow', 'last week', 'next month'
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        if date_string.lower() == 'today':
            return today
        elif date_string.lower() == 'yesterday':
            return today - timedelta(days=1)
        elif date_string.lower() == 'tomorrow':
            return today + timedelta(days=1)
        elif date_string.lower() == 'last week':
            return today - timedelta(weeks=1)
        elif date_string.lower() == 'next week':
            return today + timedelta(weeks=1)
        elif date_string.lower() == 'last month':
            # Đơn giản hóa: giả sử 30 ngày một tháng
            return today - timedelta(days=30)
        elif date_string.lower() == 'next month':
            # Đơn giản hóa: giả sử 30 ngày một tháng
            return today + timedelta(days=30)
    except:
        pass
    
    # Không thể chuyển đổi
    raise ValueError(f"Không thể chuyển đổi chuỗi ngày tháng: {date_string}")

def get_date_range(
    start_date: Union[str, datetime],
    end_date: Optional[Union[str, datetime]] = None,
    days: Optional[int] = None,
    include_time: bool = False
) -> Tuple[datetime, datetime]:
    """
    Tạo khoảng thời gian từ ngày bắt đầu đến ngày kết thúc hoặc số ngày.
    
    Args:
        start_date: Ngày bắt đầu (chuỗi hoặc datetime)
        end_date: Ngày kết thúc (chuỗi hoặc datetime), có thể bỏ qua nếu chỉ định days
        days: Số ngày từ ngày bắt đầu, có thể bỏ qua nếu chỉ định end_date
        include_time: Có giữ lại thông tin giờ, phút, giây hay không
        
    Returns:
        Tuple (start_datetime, end_datetime)
    """
    # Chuyển đổi start_date thành datetime
    if isinstance(start_date, str):
        start_dt = parse_date_string(start_date)
    else:
        start_dt = start_date
    
    # Nếu không giữ lại thông tin thời gian, đặt về 00:00:00
    if not include_time:
        start_dt = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Nếu chỉ định end_date
    if end_date is not None:
        if isinstance(end_date, str):
            end_dt = parse_date_string(end_date)
        else:
            end_dt = end_date
        
        if not include_time:
            end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Nếu chỉ định days
    elif days is not None:
        if days < 0:
            raise ValueError("Số ngày phải là số không âm")
        
        # Tính ngày kết thúc
        if days == 0:
            end_dt = start_dt
        else:
            end_dt = start_dt + timedelta(days=days)
            
            if not include_time:
                end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Nếu không chỉ định cả end_date và days, sử dụng ngày hiện tại
    else:
        end_dt = datetime.now()
        
        if not include_time:
            end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    return start_dt, end_dt

def generate_time_periods(
    start_date: Union[str, datetime],
    end_date: Union[str, datetime],
    interval: str = 'daily'
) -> List[Tuple[datetime, datetime]]:
    """
    Tạo danh sách các khoảng thời gian từ start_date đến end_date.
    
    Args:
        start_date: Ngày bắt đầu
        end_date: Ngày kết thúc
        interval: Khoảng thời gian ('hourly', 'daily', 'weekly', 'monthly')
        
    Returns:
        Danh sách các khoảng thời gian (start, end)
    """
    # Chuyển đổi thành datetime
    if isinstance(start_date, str):
        start_dt = parse_date_string(start_date)
    else:
        start_dt = start_date
    
    if isinstance(end_date, str):
        end_dt = parse_date_string(end_date)
    else:
        end_dt = end_date
    
    periods = []
    
    if interval == 'hourly':
        # Tạo các khoảng thời gian 1 giờ
        current = start_dt.replace(minute=0, second=0, microsecond=0)
        
        while current < end_dt:
            period_end = current + timedelta(hours=1) - timedelta(microseconds=1)
            
            if period_end > end_dt:
                period_end = end_dt
                
            periods.append((current, period_end))
            current += timedelta(hours=1)
            
    elif interval == 'daily':
        # Tạo các khoảng thời gian 1 ngày
        current = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        
        while current < end_dt:
            period_end = current + timedelta(days=1) - timedelta(microseconds=1)
            
            if period_end > end_dt:
                period_end = end_dt
                
            periods.append((current, period_end))
            current += timedelta(days=1)
            
    elif interval == 'weekly':
        # Tạo các khoảng thời gian 1 tuần (bắt đầu từ thứ Hai)
        # Điều chỉnh ngày bắt đầu về thứ Hai gần nhất
        days_since_monday = start_dt.weekday()
        current = start_dt.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_monday)
        
        while current < end_dt:
            period_end = current + timedelta(days=7) - timedelta(microseconds=1)
            
            if period_end > end_dt:
                period_end = end_dt
                
            periods.append((current, period_end))
            current += timedelta(days=7)
            
    elif interval == 'monthly':
        # Tạo các khoảng thời gian 1 tháng
        current = start_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        while current < end_dt:
            # Tính ngày đầu tiên của tháng tiếp theo
            if current.month == 12:
                next_month = current.replace(year=current.year + 1, month=1)
            else:
                next_month = current.replace(month=current.month + 1)
                
            period_end = next_month - timedelta(microseconds=1)
            
            if period_end > end_dt:
                period_end = end_dt
                
            periods.append((current, period_end))
            current = next_month
    
    return periods

def format_timestamp_for_display(
    timestamp: Union[str, datetime],
    format_string: Optional[str] = None,
    locale: str = 'vi_VN'
) -> str:
    """
    Định dạng timestamp để hiển thị.
    
    Args:
        timestamp: Datetime hoặc chuỗi cần định dạng
        format_string: Định dạng tùy chỉnh (nếu có)
        locale: Ngôn ngữ địa phương (vi_VN, en_US, ...)
        
    Returns:
        Chuỗi đã định dạng
    """
    # Chuyển đổi thành datetime nếu là chuỗi
    if isinstance(timestamp, str):
        dt = parse_date_string(timestamp)
    else:
        dt = timestamp
    
    # Định dạng mặc định dựa trên locale
    if format_string is None:
        if locale.startswith('vi'):
            format_string = '%d/%m/%Y %H:%M:%S'
        else:
            format_string = '%m/%d/%Y %H:%M:%S'
    
    return dt.strftime(format_string) 
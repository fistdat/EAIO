-- Initialize TimescaleDB và cấu trúc cơ sở dữ liệu cho EAIO
-- Được thực thi tự động khi container PostgreSQL khởi động lần đầu

-- Tạo extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Bảng chính cho thông tin tòa nhà
CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    size NUMERIC,
    floors INTEGER,
    built_year INTEGER,
    energy_sources TEXT[],
    primary_use TEXT,
    occupancy_hours TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tạo các chỉ mục cho tòa nhà
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type);
CREATE INDEX IF NOT EXISTS idx_buildings_location ON buildings(location);

-- Bảng chính cho dữ liệu năng lượng (sẽ chuyển đổi thành hypertable)
CREATE TABLE IF NOT EXISTS energy_data (
    time TIMESTAMPTZ NOT NULL,
    building_id TEXT NOT NULL,
    electricity NUMERIC,
    water NUMERIC,
    gas NUMERIC,
    steam NUMERIC,
    hotwater NUMERIC,
    chilledwater NUMERIC,
    source TEXT DEFAULT 'measured',
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Chuyển đổi thành TimescaleDB hypertable
SELECT create_hypertable('energy_data', 'time', if_not_exists => TRUE);

-- Tạo các continuous aggregate cho việc lấy mẫu theo giờ
CREATE MATERIALIZED VIEW IF NOT EXISTS energy_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    building_id,
    AVG(electricity) AS avg_electricity,
    AVG(water) AS avg_water,
    AVG(gas) AS avg_gas,
    AVG(steam) AS avg_steam,
    AVG(hotwater) AS avg_hotwater,
    AVG(chilledwater) AS avg_chilledwater,
    MAX(electricity) AS max_electricity,
    MIN(electricity) AS min_electricity,
    COUNT(*) AS sample_count
FROM energy_data
GROUP BY bucket, building_id;

-- Continuous aggregate cho dữ liệu theo ngày
CREATE MATERIALIZED VIEW IF NOT EXISTS energy_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    building_id,
    AVG(electricity) AS avg_electricity,
    AVG(water) AS avg_water,
    AVG(gas) AS avg_gas,
    AVG(steam) AS avg_steam,
    AVG(hotwater) AS avg_hotwater,
    AVG(chilledwater) AS avg_chilledwater,
    MAX(electricity) AS max_electricity,
    MIN(electricity) AS min_electricity,
    COUNT(*) AS sample_count
FROM energy_data
GROUP BY bucket, building_id;

-- Continuous aggregate cho dữ liệu theo tuần
CREATE MATERIALIZED VIEW IF NOT EXISTS energy_weekly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('7 days', time) AS bucket,
    building_id,
    AVG(electricity) AS avg_electricity,
    AVG(water) AS avg_water,
    AVG(gas) AS avg_gas,
    AVG(steam) AS avg_steam,
    AVG(hotwater) AS avg_hotwater,
    AVG(chilledwater) AS avg_chilledwater,
    MAX(electricity) AS max_electricity,
    MIN(electricity) AS min_electricity,
    COUNT(*) AS sample_count
FROM energy_data
GROUP BY bucket, building_id;

-- Continuous aggregate cho dữ liệu theo tháng
CREATE MATERIALIZED VIEW IF NOT EXISTS energy_monthly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('30 days', time) AS bucket,
    building_id,
    AVG(electricity) AS avg_electricity,
    AVG(water) AS avg_water,
    AVG(gas) AS avg_gas,
    AVG(steam) AS avg_steam,
    AVG(hotwater) AS avg_hotwater,
    AVG(chilledwater) AS avg_chilledwater,
    MAX(electricity) AS max_electricity,
    MIN(electricity) AS min_electricity,
    COUNT(*) AS sample_count
FROM energy_data
GROUP BY bucket, building_id;

-- Bảng cho dữ liệu thời tiết
CREATE TABLE IF NOT EXISTS weather_data (
    time TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    temperature NUMERIC,
    humidity NUMERIC,
    wind_speed NUMERIC,
    precipitation NUMERIC,
    cloud_cover NUMERIC,
    source TEXT DEFAULT 'api'
);

-- Chuyển đổi thành TimescaleDB hypertable
SELECT create_hypertable('weather_data', 'time', if_not_exists => TRUE);

-- Bảng cho dự báo
CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    building_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    forecast_type TEXT NOT NULL,
    consumption_type TEXT NOT NULL,
    forecast_horizon INTEGER NOT NULL,
    model_type TEXT NOT NULL,
    parameters JSONB,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Dữ liệu dự báo chuỗi thời gian (điểm dự báo)
CREATE TABLE IF NOT EXISTS forecast_data (
    forecast_id INTEGER NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    value NUMERIC NOT NULL,
    lower_bound NUMERIC,
    upper_bound NUMERIC,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id)
);

-- Chuyển đổi thành TimescaleDB hypertable
SELECT create_hypertable('forecast_data', 'time', if_not_exists => TRUE);

-- Bảng cho dữ liệu kịch bản
CREATE TABLE IF NOT EXISTS scenario_data (
    scenario_id INTEGER NOT NULL,
    building_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scenario_type TEXT NOT NULL, -- 'baseline', 'optimized', 'worst_case'
    time TIMESTAMPTZ NOT NULL,
    value NUMERIC NOT NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Chuyển đổi thành TimescaleDB hypertable
SELECT create_hypertable('scenario_data', 'time', if_not_exists => TRUE);

-- Bảng cho lịch sử agent
CREATE TABLE IF NOT EXISTS agent_messages (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB
);

-- Tạo chỉ mục cho agent_messages
CREATE INDEX IF NOT EXISTS idx_agent_messages_timestamp ON agent_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_agent_id ON agent_messages(agent_id);

-- Bảng cho đề xuất
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    building_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact NUMERIC,
    implementation_cost TEXT,
    priority TEXT,
    status TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Bảng cho các bất thường
CREATE TABLE IF NOT EXISTS anomalies (
    id SERIAL PRIMARY KEY,
    building_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    consumption_type TEXT NOT NULL,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Chỉ mục cho anomalies
CREATE INDEX IF NOT EXISTS idx_anomalies_building_timestamp ON anomalies(building_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_anomalies_resolved ON anomalies(resolved);

-- Tạo policy để dữ liệu cũ được nén tự động (> 30 ngày)
SELECT add_compression_policy('energy_data', INTERVAL '30 days');
SELECT add_compression_policy('weather_data', INTERVAL '30 days');
SELECT add_compression_policy('forecast_data', INTERVAL '7 days');

-- Cấp quyền cho user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO eaio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO eaio;

-- Tạo function để update updated_at tự động
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo trigger cho các bảng có trường updated_at
CREATE TRIGGER update_buildings_updated_at
BEFORE UPDATE ON buildings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
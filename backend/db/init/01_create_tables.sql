-- Enable PostGIS extension for geo capabilities
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
    building_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    building_type VARCHAR(50) NOT NULL,
    year_built INTEGER,
    floor_area FLOAT NOT NULL,
    num_floors INTEGER,
    primary_use VARCHAR(50) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create weather stations table
CREATE TABLE IF NOT EXISTS weather_stations (
    station_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    elevation FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create weather data table
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES weather_stations(station_id),
    timestamp TIMESTAMP NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    wind_speed FLOAT,
    wind_direction FLOAT,
    precipitation FLOAT,
    pressure FLOAT,
    solar_radiation FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, timestamp)
);

-- Create building consumption table
CREATE TABLE IF NOT EXISTS building_consumption (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(50) NOT NULL REFERENCES buildings(building_id),
    timestamp TIMESTAMP NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- electricity, gas, water, etc.
    value FLOAT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, timestamp, metric_type)
);

-- Create anomalies table to store detected anomalies
CREATE TABLE IF NOT EXISTS anomalies (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(50) NOT NULL REFERENCES buildings(building_id),
    timestamp TIMESTAMP NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value FLOAT NOT NULL,
    expected_value FLOAT NOT NULL,
    deviation_percentage FLOAT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, timestamp, metric_type)
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    recommendation_id VARCHAR(50) UNIQUE NOT NULL,
    building_id VARCHAR(50) NOT NULL REFERENCES buildings(building_id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    energy_savings FLOAT,
    cost_savings FLOAT,
    co2_reduction FLOAT,
    payback_period FLOAT,
    impact_level VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    forecast_id VARCHAR(50) UNIQUE NOT NULL,
    building_id VARCHAR(50) NOT NULL REFERENCES buildings(building_id),
    metric_type VARCHAR(50) NOT NULL,
    forecast_date TIMESTAMP NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create forecast values table
CREATE TABLE IF NOT EXISTS forecast_values (
    id SERIAL PRIMARY KEY,
    forecast_id VARCHAR(50) NOT NULL REFERENCES forecasts(forecast_id),
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    lower_bound FLOAT,
    upper_bound FLOAT,
    confidence_level FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(forecast_id, timestamp)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_building_consumption_building_id ON building_consumption(building_id);
CREATE INDEX IF NOT EXISTS idx_building_consumption_timestamp ON building_consumption(timestamp);
CREATE INDEX IF NOT EXISTS idx_building_consumption_metric ON building_consumption(metric_type);
CREATE INDEX IF NOT EXISTS idx_weather_data_station_id ON weather_data(station_id);
CREATE INDEX IF NOT EXISTS idx_weather_data_timestamp ON weather_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_anomalies_building_id ON anomalies(building_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp);
CREATE INDEX IF NOT EXISTS idx_recommendations_building_id ON recommendations(building_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_building_id ON forecasts(building_id);
CREATE INDEX IF NOT EXISTS idx_forecast_values_forecast_id ON forecast_values(forecast_id);
CREATE INDEX IF NOT EXISTS idx_forecast_values_timestamp ON forecast_values(timestamp);

-- Create geo index for weather stations
CREATE INDEX IF NOT EXISTS idx_weather_stations_geo ON weather_stations USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_buildings_updated_at
BEFORE UPDATE ON buildings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at
BEFORE UPDATE ON recommendations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 
-- Database initialization script for Energy AI Optimizer

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    type VARCHAR(100),
    size FLOAT,
    floors INTEGER,
    built_year INTEGER,
    energy_sources TEXT[],
    primary_use VARCHAR(100),
    occupancy_hours VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create electricity_consumption table
CREATE TABLE IF NOT EXISTS electricity_consumption (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT 'kWh',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create water_consumption table
CREATE TABLE IF NOT EXISTS water_consumption (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT 'm³',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create gas_consumption table 
CREATE TABLE IF NOT EXISTS gas_consumption (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT 'm³',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create steam_consumption table
CREATE TABLE IF NOT EXISTS steam_consumption (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(255) NOT NULL, 
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT 'kg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create hotwater_consumption table
CREATE TABLE IF NOT EXISTS hotwater_consumption (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT 'm³',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create chilledwater_consumption table
CREATE TABLE IF NOT EXISTS chilledwater_consumption (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) DEFAULT 'm³',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create indices for faster queries
CREATE INDEX IF NOT EXISTS idx_electricity_building_id ON electricity_consumption(building_id);
CREATE INDEX IF NOT EXISTS idx_electricity_timestamp ON electricity_consumption(timestamp);
CREATE INDEX IF NOT EXISTS idx_water_building_id ON water_consumption(building_id);
CREATE INDEX IF NOT EXISTS idx_water_timestamp ON water_consumption(timestamp);
CREATE INDEX IF NOT EXISTS idx_gas_building_id ON gas_consumption(building_id);
CREATE INDEX IF NOT EXISTS idx_gas_timestamp ON gas_consumption(timestamp);
CREATE INDEX IF NOT EXISTS idx_steam_building_id ON steam_consumption(building_id);
CREATE INDEX IF NOT EXISTS idx_steam_timestamp ON steam_consumption(timestamp);
CREATE INDEX IF NOT EXISTS idx_hotwater_building_id ON hotwater_consumption(building_id);
CREATE INDEX IF NOT EXISTS idx_hotwater_timestamp ON hotwater_consumption(timestamp);
CREATE INDEX IF NOT EXISTS idx_chilledwater_building_id ON chilledwater_consumption(building_id);
CREATE INDEX IF NOT EXISTS idx_chilledwater_timestamp ON chilledwater_consumption(timestamp); 
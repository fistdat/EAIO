// MongoDB initialization script
print('Starting MongoDB initialization...');

// Connect to the database
db = db.getSiblingDB('energy-ai-optimizer');

// Create collections
db.createCollection('buildings');
db.createCollection('consumption_data');
db.createCollection('recommendations');
db.createCollection('anomalies');
db.createCollection('forecasts');
db.createCollection('weather_data');

// Create indexes for better performance
db.buildings.createIndex({ "id": 1 }, { unique: true });
db.consumption_data.createIndex({ "building_id": 1, "timestamp": 1, "metric": 1 });
db.recommendations.createIndex({ "building_id": 1 });
db.anomalies.createIndex({ "building_id": 1, "timestamp": 1 });
db.forecasts.createIndex({ "building_id": 1, "timestamp": 1 });
db.weather_data.createIndex({ "location": 1, "timestamp": 1 });

// Print status
print('MongoDB initialization completed.');
print('Collections created:');
db.getCollectionNames().forEach(function(name) {
  print(' - ' + name);
}); 
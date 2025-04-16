# Energy AI Optimizer Sequence Diagrams

This document contains sequence diagrams for key processes in the Energy AI Optimizer system, illustrating the interactions between components during typical operations.

## 1. Building Energy Consumption Analysis

This sequence diagram illustrates the process of analyzing energy consumption data for a building.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Gateway
    participant BA as Building API
    participant AA as Analysis API
    participant DAA as Data Analysis Agent
    participant DB as Database

    User->>UI: Select building for analysis
    UI->>API: GET /api/buildings/{id}
    API->>BA: Forward request
    BA->>DB: Query building data
    DB-->>BA: Return building info
    BA-->>API: Return building data
    API-->>UI: Display building information
    
    User->>UI: Request consumption analysis
    UI->>API: POST /api/analysis/building/{id}
    API->>AA: Forward request
    AA->>DB: Query consumption data
    DB-->>AA: Return energy data
    AA->>DAA: Request data analysis
    
    Note over DAA: Perform pattern analysis, anomaly detection, and usage profiling
    
    DAA->>DB: Store analysis results
    DAA-->>AA: Return analysis results
    AA-->>API: Return processed results
    API-->>UI: Display analysis dashboard
    UI->>User: Show consumption patterns, anomalies, and insights
```

## 2. Recommendation Generation Process

This sequence diagram shows how energy optimization recommendations are generated and presented to the user.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Gateway
    participant RA as Recommendation API
    participant RAG as Recommendation Agent
    participant DAA as Data Analysis Agent
    participant DB as Database

    User->>UI: Request recommendations for building
    UI->>API: POST /api/recommendations/generate
    API->>RA: Forward request with building ID
    
    RA->>DB: Retrieve building info
    DB-->>RA: Return building data
    
    RA->>DB: Query consumption data
    DB-->>RA: Return energy data
    
    RA->>DAA: Request data analysis
    DAA->>DAA: Analyze patterns and inefficiencies
    DAA-->>RA: Return analysis results
    
    RA->>RAG: Generate recommendations
    
    Note over RAG: Apply energy optimization rules, calculate potential savings, and prioritize recommendations
    
    RAG-->>RA: Return prioritized recommendations
    RA->>DB: Store recommendations
    RA-->>API: Return recommendation list
    API-->>UI: Display recommendations
    UI->>User: Show prioritized recommendations with savings estimates
```

## 3. Energy Consumption Forecasting

This sequence diagram illustrates the process of generating energy consumption forecasts.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Gateway
    participant FA as Forecasting API
    participant FAG as Forecasting Agent
    participant WA as Weather API
    participant DB as Database

    User->>UI: Request energy forecast
    UI->>API: POST /api/forecasting/building/{id}
    API->>FA: Forward request with parameters
    
    FA->>DB: Query historical consumption
    DB-->>FA: Return consumption history
    
    FA->>WA: Request weather forecast
    WA-->>FA: Return weather prediction
    
    FA->>FAG: Generate energy forecast
    
    Note over FAG: Apply forecasting model (ARIMA, Prophet, Neural Networks)
    
    FAG->>FAG: Generate baseline forecast
    FAG->>FAG: Generate optimized scenario
    FAG->>FAG: Generate worst-case scenario
    
    FAG-->>FA: Return forecast data and scenarios
    FA->>DB: Store forecast results
    FA-->>API: Return forecast and scenarios
    API-->>UI: Display forecast chart
    UI->>User: Show forecast with confidence intervals and scenarios
```

## 4. Multi-Agent Collaboration for Complex Analysis

This sequence diagram shows how multiple agents collaborate for complex energy analysis tasks.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Gateway
    participant CA as Commander Agent
    participant DAA as Data Analysis Agent
    participant RAG as Recommendation Agent
    participant FAG as Forecasting Agent
    participant MA as Memory Agent
    participant DB as Database

    User->>UI: Request comprehensive energy analysis
    UI->>API: POST /api/analysis/comprehensive/{id}
    API->>CA: Forward request with parameters
    
    CA->>MA: Retrieve building context
    MA-->>CA: Return building context and history
    
    CA->>DAA: Request consumption analysis
    DAA->>DB: Query consumption data
    DB-->>DAA: Return energy data
    DAA->>DAA: Analyze consumption patterns
    DAA-->>CA: Return analysis results
    
    CA->>RAG: Request optimization recommendations
    RAG->>RAG: Generate recommendations based on analysis
    RAG-->>CA: Return recommendations
    
    CA->>FAG: Request consumption forecast
    FAG->>FAG: Generate forecast with recommendations
    FAG-->>CA: Return forecast data
    
    CA->>MA: Store analysis context
    CA-->>API: Return comprehensive results
    API-->>UI: Display multi-faceted analysis
    UI->>User: Show integrated analysis dashboard
```

## 5. User Interaction with Natural Language Interface

This sequence diagram illustrates how users can interact with the system using natural language.

```mermaid
sequenceDiagram
    actor User
    participant UI as Chat Interface
    participant API as API Gateway
    participant CA as Commander Agent
    participant Agents as Specialized Agents
    participant MA as Memory Agent
    participant DB as Database

    User->>UI: Enter natural language query
    Note right of User: "What are the energy consumption patterns for Building A and how can we optimize them?"
    
    UI->>API: POST /api/chat/query
    API->>CA: Forward query
    
    CA->>MA: Retrieve context
    MA-->>CA: Return conversation history
    
    CA->>CA: Interpret query intent
    CA->>CA: Decompose into sub-tasks
    
    CA->>Agents: Delegate sub-tasks to appropriate agents
    Agents->>DB: Query relevant data
    DB-->>Agents: Return requested data
    Agents->>Agents: Process sub-tasks
    Agents-->>CA: Return sub-task results
    
    CA->>CA: Synthesize complete response
    CA->>MA: Store interaction
    CA-->>API: Return formatted response
    API-->>UI: Display conversational response
    UI->>User: Show answer with visualizations
```

## 6. Data Migration Process (MongoDB to PostgreSQL)

This sequence diagram shows the process of migrating data from MongoDB to PostgreSQL.

```mermaid
sequenceDiagram
    participant Admin
    participant Script as Migration Script
    participant Mongo as MongoDB
    participant PG as PostgreSQL/TimescaleDB
    participant App as Application

    Admin->>Script: Start migration process
    
    Script->>Mongo: Connect to MongoDB
    Mongo-->>Script: Connection established
    
    Script->>PG: Connect to PostgreSQL
    PG-->>Script: Connection established
    
    Script->>Mongo: Query buildings collection
    Mongo-->>Script: Return buildings data
    
    Script->>Script: Transform building data
    Script->>PG: Insert buildings into PostgreSQL
    PG-->>Script: Confirm buildings migration
    
    loop For each chunk of energy data
        Script->>Mongo: Query energy data chunk
        Mongo-->>Script: Return energy data chunk
        Script->>Script: Transform energy data
        Script->>PG: Batch insert into energy_data hypertable
        PG-->>Script: Confirm chunk migration
    end
    
    Script->>PG: Refresh continuous aggregates
    PG-->>Script: Aggregates refreshed
    
    Script->>Admin: Report migration success
    
    Admin->>App: Configure to use PostgreSQL
    App->>PG: Connect to PostgreSQL
    PG-->>App: Connection established
    
    Note over App, PG: System now using PostgreSQL as primary database
```

## 7. Frontend API Integration with Backend Services

Biểu đồ trình tự này mô tả cách các thành phần frontend tương tác với backend thông qua các dịch vụ API.

```mermaid
sequenceDiagram
    actor User
    participant Component as Frontend Component
    participant AnalysisAPI as analysisApi Service
    participant BuildingAPI as buildingApi Service
    participant APIConfig as apiConfig Utility
    participant Axios as Axios Client
    participant FastAPI as Backend API Router
    participant Agent as Backend Agents
    participant DB as Database

    User->>Component: Tương tác với giao diện
    Component->>BuildingAPI: getBuildings()
    
    alt useMockData configuration
        BuildingAPI->>APIConfig: Kiểm tra useMockData
        APIConfig-->>BuildingAPI: True (Sử dụng dữ liệu mẫu)
        BuildingAPI->>BuildingAPI: Tạo dữ liệu mẫu
        BuildingAPI-->>Component: Trả về dữ liệu mẫu
    else useMockData = false
        BuildingAPI->>APIConfig: Lấy thông tin cấu hình API
        APIConfig-->>BuildingAPI: Trả về apiBaseUrl, version
        BuildingAPI->>Axios: GET /api/v1/buildings
        Axios->>FastAPI: HTTP Request
        FastAPI->>Agent: Gọi BuildingDataAgent
        Agent->>DB: Truy vấn dữ liệu
        DB-->>Agent: Trả về dữ liệu
        Agent-->>FastAPI: Kết quả xử lý
        FastAPI-->>Axios: HTTP Response
        Axios-->>BuildingAPI: Dữ liệu JSON
        BuildingAPI->>BuildingAPI: Chuyển đổi dữ liệu sang TypeScript interface
        BuildingAPI-->>Component: Trả về dữ liệu tòa nhà
    end
    
    Component->>Component: Cập nhật state
    Component->>User: Hiển thị dữ liệu

    User->>Component: Yêu cầu phân tích dữ liệu
    Component->>AnalysisAPI: getBuildingEnergyAnalysis(buildingId, startDate, endDate)
    
    alt useMockData configuration
        AnalysisAPI->>APIConfig: Kiểm tra useMockData
        APIConfig-->>AnalysisAPI: True (Sử dụng dữ liệu mẫu)
        AnalysisAPI->>AnalysisAPI: Tạo dữ liệu phân tích mẫu
        AnalysisAPI-->>Component: Trả về dữ liệu phân tích mẫu
    else useMockData = false
        AnalysisAPI->>APIConfig: Lấy thông tin cấu hình API
        APIConfig-->>AnalysisAPI: Trả về apiBaseUrl, version
        AnalysisAPI->>Axios: GET /api/v1/analysis/building (với tham số)
        Axios->>FastAPI: HTTP Request
        FastAPI->>Agent: Gọi DataAnalysisAgent
        Agent->>DB: Truy vấn dữ liệu tiêu thụ
        DB-->>Agent: Trả về dữ liệu
        Agent->>Agent: Phân tích mẫu, phát hiện bất thường
        Agent-->>FastAPI: Kết quả phân tích
        FastAPI-->>Axios: HTTP Response
        Axios-->>AnalysisAPI: Dữ liệu JSON
        AnalysisAPI->>AnalysisAPI: Chuyển đổi dữ liệu sang TypeScript interface
        AnalysisAPI-->>Component: Trả về kết quả phân tích
    end
    
    Component->>Component: Cập nhật state
    Component->>User: Hiển thị biểu đồ và phân tích
```

## 8. Chi tiết luồng dữ liệu API hiện tại (Direct Endpoints)

Biểu đồ này minh họa luồng dữ liệu hiện tại mà không sử dụng API Gateway.

```mermaid
sequenceDiagram
    participant Frontend as Frontend Component
    participant APIService as Frontend API Service
    participant Endpoint as FastAPI Endpoint
    participant Agent as Backend Agent
    participant DataLayer as Data Access Layer
    participant DB as Database

    Frontend->>APIService: Gọi phương thức API
    APIService->>Endpoint: HTTP Request (trực tiếp đến endpoint)
    Endpoint->>Agent: Gọi backend agent thích hợp
    Agent->>DataLayer: Yêu cầu dữ liệu
    DataLayer->>DB: Truy vấn database
    DB-->>DataLayer: Trả về raw data
    DataLayer-->>Agent: Dữ liệu đã xử lý
    Agent->>Agent: Thực hiện phân tích dữ liệu
    Agent-->>Endpoint: Kết quả phân tích
    Endpoint-->>APIService: HTTP Response (JSON)
    APIService->>APIService: Chuyển đổi response sang TypeScript interface
    APIService-->>Frontend: Trả về dữ liệu đã định dạng
    Frontend->>Frontend: Cập nhật UI state
```

These sequence diagrams illustrate the key processes and interactions within the Energy AI Optimizer system, showing how the different components collaborate to analyze energy data, generate insights, and provide recommendations to users. 
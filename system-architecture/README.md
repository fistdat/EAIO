# Energy AI Optimizer System Architecture Documentation

This folder contains comprehensive architectural documentation for the Energy AI Optimizer system, a multi-agent AI platform designed to analyze building energy consumption data, identify optimization opportunities, and provide actionable recommendations.

## Documentation Files

1. **[System Architecture](system-architecture.md)** - Overview of the complete system architecture, including components, interactions, and deployment model.

2. **[Database ERD](database-erd.md)** - Entity-Relationship Diagram and detailed explanation of the database schema.

3. **[Sequence Diagrams](sequence-diagrams.md)** - Series of sequence diagrams illustrating key processes and interactions between system components.

## Key Architecture Features

- **Multi-Agent Architecture**: Microsoft AutoGen-based agents specialized for different aspects of energy optimization
- **Dual Database Support**: MongoDB and PostgreSQL with TimescaleDB for time-series data
- **Microservices Design**: Containerized services for frontend, backend, and databases
- **Vector Database**: Milvus for semantic search and agent memory
- **Role-Based UI**: Specialized views for facility managers, energy analysts, and executives

## System Components

The Energy AI Optimizer consists of the following main components:

### Frontend
- React/TypeScript-based UI with role-specific views
- Dashboard, Analytics, Forecasting, and Reports pages
- API client services for backend communication

### Backend
- FastAPI-based RESTful API
- Building, Analysis, Recommendation, Forecasting, and Weather endpoints
- Data processing layer for energy metrics

### Agent System
- Commander Agent for orchestration
- Data Analysis Agent for consumption pattern analysis
- Recommendation Agent for energy optimization strategies
- Forecasting Agent for energy consumption prediction
- Support agents for memory, evaluation, and external interfaces

### Data Storage
- TimescaleDB for optimized time-series data
- Redis for caching and messaging
- Milvus for vector embeddings

## Deployment

The system is deployed using Docker containers orchestrated with Docker Compose. Each component runs in its own container, allowing for easy scaling and management.

## Diagrams

All diagrams in the documentation are created using Mermaid, a markdown-based diagramming tool. The diagrams include:

- System architecture diagram
- Entity-relationship diagram
- Sequence diagrams for key processes

## Usage Guide

To view the diagrams properly:
1. Use a Markdown viewer that supports Mermaid diagrams
2. Or convert the diagrams to images using the Mermaid CLI:
   ```
   mmdc -i file.md -o diagram.svg
   ```

## Implementation Guidance

The architecture documentation provides a blueprint for implementing the Energy AI Optimizer system. Key implementation considerations include:

- Using Microsoft AutoGen for agent implementation
- Implementing a migration path from MongoDB to PostgreSQL
- Leveraging TimescaleDB for efficient time-series data handling
- Building role-specific UIs for different user types
- Implementing Docker-based deployment for all components 
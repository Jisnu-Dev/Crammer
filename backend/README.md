# Crammer+ Backend

Modern, scalable FastAPI backend connected to Neon PostgreSQL database.

## Architecture

This project follows a clean, modular architecture:

```
backend/
├── app/
│   ├── api/                    # API routes and endpoints
│   │   └── v1/
│   │       ├── routes/        # Individual route modules
│   │       └── endpoints.py   # Main router
│   ├── config/                # Configuration settings
│   ├── core/                  # Core functionality
│   │   ├── database.py       # Database setup
│   │   ├── exceptions.py     # Custom exceptions
│   │   └── logging_config.py # Logging configuration
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic layer
│   └── utils/                 # Utility functions
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── README.md
```

## Features

- ✅ **Modular Architecture**: Separation of concerns with distinct layers
- ✅ **Reusable Components**: Base classes for models, schemas, and services
- ✅ **Type Safety**: Pydantic schemas for validation
- ✅ **Error Handling**: Custom exception classes and global handlers
- ✅ **Database Optimization**: Connection pooling and efficient queries
- ✅ **API Versioning**: Version-controlled API endpoints
- ✅ **Logging**: Comprehensive logging system
- ✅ **CORS Support**: Configurable CORS settings
- ✅ **Auto Documentation**: Swagger UI and ReDoc

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

The `.env` file contains your database connection and settings:

```env
DATABASE_URL=postgresql://...
DEBUG=True
PORT=8000
```

### 3. Run the Server

Using Python:
```bash
cd backend
python -m app.main
```

Using Uvicorn directly:
```bash
cd backend
uvicorn app.main:app --reload
```

## API Endpoints

### Root
- `GET /` - API information

### Health Check
- `GET /api/v1/health/` - Basic health check
- `GET /api/v1/health/db` - Database health check
- `GET /api/v1/health/detailed` - Detailed system health

## Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Development Guidelines

### Adding New Features

1. **Create a Model** in `app/models/`
2. **Create Schemas** in `app/schemas/`
3. **Create a Service** in `app/services/`
4. **Create Routes** in `app/api/v1/routes/`
5. **Register Router** in `app/api/v1/endpoints.py`

### Best Practices

- Use type hints for all functions
- Follow PEP 8 naming conventions
- Create reusable base classes
- Write docstrings for all public methods
- Handle exceptions properly
- Log important operations
- Validate input with Pydantic schemas

## Project Structure Explained

- **api/**: HTTP layer - routes, dependencies, request/response handling
- **core/**: Application core - database, exceptions, logging
- **models/**: Database models (SQLAlchemy ORM)
- **schemas/**: Data validation and serialization (Pydantic)
- **services/**: Business logic and data manipulation
- **utils/**: Helper functions and utilities
- **config/**: Configuration and settings management

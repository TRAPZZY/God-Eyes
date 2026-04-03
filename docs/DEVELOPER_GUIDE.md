# God Eyes - Developer Guide

## Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL (or use SQLite for development)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
pip install pytest httpx psutil

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Testing

```bash
# Run all backend tests
cd backend
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_auth.py -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### Code Style

- Follow PEP 8 for Python
- Use type hints for all function signatures
- Write docstrings for all public functions
- Keep functions under 50 lines when possible

### Adding New Features

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Write tests first (TDD approach)
3. Implement the feature
4. Run all tests: `python -m pytest tests/ -v`
5. Submit pull request

### Project Structure

```
backend/app/
├── main.py           # FastAPI application factory
├── config.py         # Settings and environment
├── database.py       # SQLAlchemy setup
├── models/           # Database models (SQLAlchemy)
├── schemas/          # Request/response schemas (Pydantic)
├── api/              # Route handlers
├── services/         # Business logic
├── core/             # Security, cache, middleware, validators
└── workers/          # Background task scheduler
```

### Database Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Debugging

- Use `--reload` flag for auto-restart on code changes
- Set `DEBUG=true` in .env for verbose logging
- API docs available at http://localhost:8000/docs
- Use `logging.getLogger("godeyes")` for application logs

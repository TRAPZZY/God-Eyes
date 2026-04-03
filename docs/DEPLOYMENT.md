# God Eyes - Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Mapbox Access Token
- PostgreSQL (or use Docker Compose)
- Domain name (for production SSL)

## Quick Deploy

### 1. Clone and Configure

```bash
git clone https://github.com/trapzzy/god-eyes.git
cd god-eyes
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your API keys.

### 2. Generate Secrets

```bash
# JWT Secret
openssl rand -hex 32

# Database Password
openssl rand -hex 32
```

### 3. Deploy with Docker Compose

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Run Migrations

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 5. Verify

```bash
curl http://localhost:8000/health
```

## Production Deployment

### Environment Variables

Set these in your production environment:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET_KEY` | JWT signing key (32+ chars) | Yes |
| `MAPBOX_ACCESS_TOKEN` | Mapbox API token | Yes |
| `OPENWEATHER_API_KEY` | Weather API key | No |
| `SENTINEL_HUB_CLIENT_ID` | Sentinel Hub client ID | No |
| `SENTINEL_HUB_CLIENT_SECRET` | Sentinel Hub secret | No |
| `DEBUG` | Set to `false` in production | Yes |
| `CORS_ORIGINS` | JSON array of allowed origins | Yes |

### SSL/TLS

For production, deploy behind Nginx with Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renew
sudo certbot renew --dry-run
```

### Cloud Deployment

#### AWS ECS
1. Create ECR repositories for backend and frontend
2. Build and push Docker images
3. Create ECS task definitions
4. Deploy with ECS service
5. Use RDS PostgreSQL for database

#### Google Cloud Run
1. Build Docker images
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Use Cloud SQL for PostgreSQL

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure environment variables
3. Add managed PostgreSQL database
4. Deploy

## Monitoring

- Health check endpoint: `GET /health`
- Admin health dashboard: `GET /api/v1/admin/health` (admin only)
- Application logs: `GET /api/v1/admin/logs` (admin only)

## Backup

### Database Backup
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U godeyes godeyes > backup.sql
```

### Database Restore
```bash
docker compose -f docker-compose.prod.yml exec -T db psql -U godeyes godeyes < backup.sql
```

## Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.prod.yml logs backend
```

### Database connection refused
- Verify `DATABASE_URL` is correct
- Check PostgreSQL container is healthy: `docker compose ps`

### Rate limiting too aggressive
- Increase `RATE_LIMIT_PER_MINUTE` in environment variables

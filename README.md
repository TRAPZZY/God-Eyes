# God Eyes

> **Defense-Grade Satellite Intelligence Platform**
>
> *See Everything. Miss Nothing.*

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/TRAPZZY/God-Eyes/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](https://www.docker.com/)

---

## Overview

**God Eyes** is a comprehensive satellite intelligence and monitoring platform that combines high-resolution satellite imagery from multiple providers with AI-powered change detection, automated monitoring schedules, geofencing, and a modern real-time dashboard.

Monitor any location on Earth. Detect changes automatically. Generate intelligence reports. All from a single, unified interface.

### Key Capabilities

- **Multi-Source Satellite Imagery** -- Mapbox (up to 30cm/pixel) and Sentinel-2 (10m/pixel, free)
- **Automated Monitoring** -- Scheduled captures on configurable intervals (hourly, daily, weekly, monthly)
- **AI Change Detection** -- SSIM, pixel differencing, and contour analysis with severity classification
- **Geofencing** -- Perimeter-based monitoring with boundary change alerts
- **NDVI Vegetation Analysis** -- Multispectral vegetation health monitoring via Sentinel-2
- **Live Camera Integration** -- Real-time webcam feeds near monitored locations
- **Weather Intelligence** -- Current conditions, forecasts, UV index, and air quality overlays
- **Time-lapse Generation** -- Animated GIF compilation of sequential captures
- **Intelligence Reports** -- HTML/PDF reports with capture history and change analysis
- **Batch Import/Export** -- CSV, GeoJSON, KML, GPX support with auto-detection
- **Interactive Dashboard** -- React + Mapbox GL JS with dark/light theme toggle
- **REST API** -- Fully documented FastAPI backend with OpenAPI/Swagger

---

## Screenshots

> *[Screenshot placeholders -- add actual screenshots before release]*

| Dashboard | Monitor | Timeline | Analysis |
|-----------|---------|----------|----------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Monitor](docs/screenshots/monitor.png) | ![Timeline](docs/screenshots/timeline.png) | ![Analysis](docs/screenshots/analysis.png) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Dashboard)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Map View │ │ Monitor  │ │ Timeline │ │ Export & Reports  │  │
│  │ (Mapbox) │ │ Panel    │ │ History  │ │ Time-lapse / PDF  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Analysis │ │ Geofence │ │ Camera   │ │ Settings & Theme  │  │
│  │ AI/NDVI  │ │ Perimeter│ │ Feeds    │ │ Dark/Light Mode   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API / Axios
┌────────────────────────────▼────────────────────────────────────┐
│                        FASTAPI BACKEND                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Auth     │ │ Location │ │ Capture  │ │ Intelligence      │  │
│  │ Module   │ │ Service  │ │ Engine   │ │ (Weather/Camera)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ AI       │ │ Change   │ │ Time-    │ │ Report &          │  │
│  │ Analysis │ │ Detect   │ │ lapse    │ │ Heatmap Gen       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
└────────┬──────────────┬──────────────┬──────────────────────────┘
         │              │              │
┌────────▼─────┐ ┌──────▼──────┐ ┌────▼────────────┐
│ PostgreSQL    │ │    Redis    │ │  Celery Workers │
│ (Users,      │ │ (Cache,     │ │ (Scheduled      │
│  Locations,  │ │  Sessions,  │ │  Tasks, Queue)  │
│  Captures)   │ │  Broker)    │ │                 │
└──────────────┘ └─────────────┘ └─────────────────┘
                      │
         ┌────────────┼─────────────────────┐
         ▼            ▼                     ▼
   ┌──────────┐ ┌──────────┐       ┌──────────────┐
   │ Mapbox   │ │ Sentinel │       │ OpenWeather  │
   │ API      │ │ Hub API  │       │ Map / Webcams│
   └──────────┘ └──────────┘       └──────────────┘
```

---

## Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Mapbox Access Token** (free at https://account.mapbox.com/)
- **Sentinel Hub credentials** (free at https://www.sentinel-hub.com/) -- optional

### 3 Commands to Launch

```bash
git clone https://github.com/TRAPZZY/God-Eyes.git && cd God-Eyes
cp backend/.env.example backend/.env   # Edit with your API keys
docker compose up -d
```

That's it. The platform starts on:

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/health |

Create your first operator account at http://localhost:3000/register.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend Framework** | FastAPI (Python) | 0.100+ |
| **Frontend Framework** | React + TypeScript | 18.x |
| **Build Tool** | Vite | 6.x |
| **Database** | PostgreSQL | 16 |
| **Cache / Message Broker** | Redis | 7 |
| **Task Queue** | Celery + Celery Beat | 5.x |
| **ORM** | SQLAlchemy | 2.x |
| **Maps** | Mapbox GL JS | 3.x |
| **Satellite Data** | Mapbox Static Images + Sentinel Hub (ESA) | -- |
| **Weather** | OpenWeatherMap API | -- |
| **Styling** | Tailwind CSS | 3.x |
| **State Management** | Zustand | 5.x |
| **Charts** | Recharts | 2.x |
| **Icons** | Lucide React | 0.468+ |
| **Containerization** | Docker + Docker Compose | -- |
| **Reverse Proxy** | Nginx | -- |

---

## Feature Reference

### Authentication & Security

| Feature | Description |
|---------|-------------|
| JWT Auth | Bearer token with access + refresh tokens |
| Password Hashing | bcrypt with automatic salt |
| Rate Limiting | Per-minute request limits |
| CORS | Configurable allowed origins |
| Input Validation | Pydantic schemas on all endpoints |

### Location Management

| Feature | Description |
|---------|-------------|
| Geocoding | Nominatim address-to-coordinates |
| Autocomplete | Real-time address search |
| Reverse Geocoding | Coordinates-to-address lookup |
| Tags & Notes | Custom metadata per location |
| Batch Import | CSV bulk upload with validation |

### Satellite Capture

| Feature | Description |
|---------|-------------|
| Multi-Source | Mapbox + Sentinel-2 providers |
| Resolution | Standard (800x600) to 8K (7680x4320) |
| Styles | Satellite, streets, outdoors, dark |
| Cloud Coverage | Automatic filtering by cloud % |
| History | Full archive with timeline view |

### Change Detection

| Algorithm | Threshold | Severity |
|-----------|-----------|----------|
| SSIM | < 0.5 | High |
| SSIM | < 0.7 | Medium |
| Pixel Diff | > 15 regions | High |
| Contour Analysis | > 5 contours | Medium |

### Monitoring & Alerts

| Feature | Description |
|---------|-------------|
| Schedules | Hourly, daily, weekly, monthly |
| Manual Trigger | On-demand capture |
| Alert Rules | Change severity, threshold-based |
| Notifications | Email, webhook, push |
| Scheduler Stats | Runs, captures, errors dashboard |

### Intelligence

| Feature | Description |
|---------|-------------|
| Weather Overlay | Temp, humidity, wind, cloud cover on map |
| Live Cameras | Nearby webcam feeds (OpenWeatherMap) |
| UV Index | Solar radiation monitoring |
| Air Quality | AQI and pollutant data |
| AI Land Use | Water, vegetation, urban, bare soil classification |
| Object Detection | Automated feature identification |
| Image Quality | Brightness, contrast, sharpness analysis |
| Vegetation Index | RGB-based vegetation health scoring |

### Export & Reports

| Feature | Description |
|---------|-------------|
| Time-lapse | Animated GIF from sequential captures |
| Reports | HTML intelligence reports |
| Print to PDF | Browser-based PDF export |
| GeoJSON Export | Full location + geofence export |
| KML Export | Google Earth compatible |
| GPX Export | GPS waypoint format |
| Auto-Detect Import | Format detection for GeoJSON/KML/GPX |

### Geofencing

| Feature | Description |
|---------|-------------|
| Polygon Geofences | Custom perimeter drawing |
| Circular Geofences | Radius-based monitoring |
| Coverage Analysis | Geofence completeness scoring |
| Point-in-Polygon | Real-time boundary checks |
| Change Alerts | Notifications on perimeter changes |

### Dashboard

| Feature | Description |
|---------|-------------|
| Interactive Map | Mapbox GL JS with markers |
| Weather Overlay | Real-time conditions card |
| Stats Cards | Locations, captures, changes |
| Theme Toggle | Dark / Light mode with persistence |
| Responsive | Mobile-friendly layout |

---

## API Reference

Full interactive documentation at `http://localhost:8000/docs`.

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create operator account |
| POST | `/api/v1/auth/login` | Authenticate, receive tokens |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/locations/` | List locations |
| POST | `/api/v1/locations/` | Create location |
| POST | `/api/v1/captures/` | Trigger satellite capture |
| GET | `/api/v1/captures/location/{id}/history` | Capture history |
| POST | `/api/v1/analysis/compare` | Compare two captures |
| GET | `/api/v1/analysis/ndvi/{id}` | NDVI vegetation analysis |

### Intelligence Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/intelligence/weather/current/{id}` | Current weather |
| GET | `/api/v1/intelligence/weather/forecast/{id}` | 1-5 day forecast |
| GET | `/api/v1/intelligence/cameras/{id}` | Nearby webcams |
| POST | `/api/v1/intelligence/timelapse/generate` | Generate time-lapse GIF |
| GET | `/api/v1/intelligence/timelapse/download/{file}` | Download time-lapse |
| GET | `/api/v1/intelligence/report/{id}` | Generate intelligence report |
| GET | `/api/v1/intelligence/heatmap/{id}` | Change heatmap image |
| POST | `/api/v1/intelligence/ai/land-use` | AI land classification |
| POST | `/api/v1/intelligence/ai/object-detection` | AI object detection |

### Import/Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/intelligence/batch/import` | CSV bulk import |
| GET | `/api/v1/intelligence/export/geojson` | Export as GeoJSON |
| GET | `/api/v1/intelligence/export/kml` | Export as KML |
| GET | `/api/v1/intelligence/export/gpx` | Export as GPX |
| POST | `/api/v1/intelligence/import/auto-detect` | Auto-format import |

---

## Satellite Data Providers

### Mapbox (Primary -- High Resolution)

| Property | Value |
|----------|-------|
| Resolution | Up to 30cm/pixel |
| Coverage | Global (varies by region) |
| Free Tier | 50,000 map loads/month |
| Best For | High-quality base imagery |
| Limitation | Images are months/years old |

### Sentinel-2 / ESA Copernicus (Secondary -- Free)

| Property | Value |
|----------|-------|
| Resolution | 10m/pixel (visible) |
| Revisit Time | ~5 days |
| Historical Archive | Since 2015 |
| Free Tier | 10 GB processing units/month |
| Best For | Change detection, NDVI, time-lapse |
| Spectral Bands | 13 (vegetation, water, urban) |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql+psycopg2://...` |
| `REDIS_URL` | Yes | Redis connection string | `redis://localhost:6379/0` |
| `MAPBOX_ACCESS_TOKEN` | Yes | Mapbox public token | -- |
| `SENTINEL_HUB_CLIENT_ID` | No | Sentinel Hub client ID | -- |
| `SENTINEL_HUB_CLIENT_SECRET` | No | Sentinel Hub client secret | -- |
| `OPENWEATHERMAP_API_KEY` | No | Weather/camera data API key | -- |
| `JWT_SECRET_KEY` | Yes | JWT signing key | `change-me-in-production` |
| `JWT_ALGORITHM` | No | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Refresh token TTL | `7` |
| `DEBUG` | No | Debug mode | `true` |
| `CORS_ORIGINS` | No | Allowed CORS origins | `http://localhost:3000` |
| `SMTP_HOST` | No | Email server host | -- |
| `SMTP_PORT` | No | Email server port | `587` |
| `SMTP_USER` | No | Email username | -- |
| `SMTP_PASSWORD` | No | Email password | -- |
| `CELERY_BROKER_URL` | Yes | Celery broker (Redis) | `redis://localhost:6379/1` |
| `CELERY_RESULT_BACKEND` | Yes | Celery results (Redis) | `redis://localhost:6379/2` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL | `http://localhost:8000` |
| `VITE_MAPBOX_TOKEN` | Yes | Mapbox public token |

---

## Deployment

### Docker Compose (Recommended)

```bash
docker compose up -d
```

Starts all services: PostgreSQL, Redis, FastAPI, Celery Worker, Celery Beat, React Frontend.

### Production Deployment

1. **Database:** Provision PostgreSQL 16+ with automated backups
2. **Cache:** Deploy Redis 7+ (Upstash, Redis Cloud, or self-hosted)
3. **Backend:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
4. **Frontend:** Build and serve as static assets:
   ```bash
   cd frontend && npm run build
   # Deploy dist/ to Nginx, Cloudflare Pages, Vercel, etc.
   ```
5. **Migrations:**
   ```bash
   cd backend && alembic upgrade head
   ```

### Production Checklist

- [ ] Generate strong `JWT_SECRET_KEY` (`openssl rand -hex 32`)
- [ ] Set `DEBUG=false`
- [ ] Configure production CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure production database with backups
- [ ] Set up monitoring and logging (Sentry, Datadog)
- [ ] Enable rate limiting
- [ ] Configure CDN for static assets and images
- [ ] Set up automated database backups
- [ ] Review and rotate all API keys

---

## Testing

### Backend Tests

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

### Frontend Build Check

```bash
cd frontend
npm install
npm run build
```

### API Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy", "version": "1.0.0"}
```

---

## Project Structure

```
god-eyes/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry
│   │   ├── config.py               # Settings & environment
│   │   ├── database.py             # SQLAlchemy engine & sessions
│   │   ├── models/                 # Database models (User, Location, Capture, etc.)
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── api/                    # REST API route handlers
│   │   ├── services/               # Business logic (Mapbox, Sentinel, AI, etc.)
│   │   ├── core/                   # Security, middleware, validators
│   │   └── workers/                # Celery background tasks
│   ├── uploads/                    # Generated files (captures, reports, etc.)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── services/api.ts         # Axios API client
│   │   ├── store/                  # Zustand stores (auth, theme)
│   │   ├── types/                  # TypeScript definitions
│   │   ├── App.tsx                 # Router & layout
│   │   └── main.tsx                # React entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docs/                           # Detailed documentation
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx.conf
├── deploy.sh / deploy.ps1
├── .github/workflows/              # CI/CD pipelines
├── README.md
└── LICENSE
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure `npm run build` passes before submitting

---

## Version History

### v1.0.0 (Current)

- Multi-source satellite imagery (Mapbox + Sentinel-2)
- Automated monitoring with Celery scheduler
- AI-powered change detection (SSIM, pixel diff, contours)
- Geofencing with perimeter alerts
- NDVI vegetation analysis
- Live camera integration
- Weather intelligence overlay
- Time-lapse GIF generation
- HTML intelligence reports with print-to-PDF
- Batch import/export (CSV, GeoJSON, KML, GPX)
- AI analysis (land use, object detection, image quality)
- Interactive React dashboard with Mapbox GL JS
- Dark/Light theme toggle
- Full REST API with OpenAPI documentation
- Docker Compose deployment
- CI/CD pipelines

---

## License

MIT License. See [LICENSE](LICENSE) file for details.

---

## Credits

**Creator:** Trapzzy
**Contact:** traphubs@outlook.com
**Repository:** https://github.com/TRAPZZY/God-Eyes

Built with FastAPI, React, Mapbox, Sentinel Hub, and a lot of ambition.

---

*God Eyes -- See Everything. Miss Nothing.*

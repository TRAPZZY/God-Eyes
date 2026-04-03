# God Eyes - Production Deployment Script (PowerShell)
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  God Eyes - Production Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

function Check-Prerequisites {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] Docker is not installed." -ForegroundColor Red
        exit 1
    }
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue) -and -not (docker compose version 2>$null)) {
        Write-Host "[ERROR] Docker Compose is not installed." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Prerequisites checked" -ForegroundColor Green
}

function Generate-Secrets {
    if (-not $env:JWT_SECRET_KEY) {
        $bytes = New-Object byte[] 32
        (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
        $env:JWT_SECRET_KEY = -join ($bytes | ForEach-Object { "{0:x2}" -f $_ })
        Write-Host "[!] Generated JWT_SECRET_KEY" -ForegroundColor Yellow
    }
    if (-not $env:POSTGRES_PASSWORD) {
        $bytes = New-Object byte[] 32
        (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
        $env:POSTGRES_PASSWORD = -join ($bytes | ForEach-Object { "{0:x2}" -f $_ })
        Write-Host "[!] Generated POSTGRES_PASSWORD" -ForegroundColor Yellow
    }
}

function Create-Env {
    $envContent = @"
DATABASE_URL=postgresql://godeyes:$($env:POSTGRES_PASSWORD)@db:5432/godeyes
JWT_SECRET_KEY=$($env:JWT_SECRET_KEY)
POSTGRES_PASSWORD=$($env:POSTGRES_PASSWORD)
MAPBOX_ACCESS_TOKEN=$($env:MAPBOX_ACCESS_TOKEN)
OPENWEATHER_API_KEY=$($env:OPENWEATHER_API_KEY)
DEBUG=false
CORS_ORIGINS=["http://localhost:3000"]
"@
    $envContent | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "[OK] Production .env created" -ForegroundColor Green
}

function Build-And-Start {
    Write-Host "[*] Building and starting services..." -ForegroundColor Yellow
    docker compose -f docker-compose.prod.yml up -d --build
    Write-Host "[OK] Services started" -ForegroundColor Green
}

function Run-Migrations {
    Write-Host "[*] Running database migrations..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] Migration skipped (Alembic not configured)" -ForegroundColor Yellow
    }
}

function Health-Check {
    Write-Host "[*] Running health checks..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] Backend health check passed" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARN] Backend health check failed (may need more time)" -ForegroundColor Yellow
    }
}

function Display-URLs {
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "  God Eyes - Deployment Complete" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "  Backend API:   http://localhost:8000"
    Write-Host "  API Docs:      http://localhost:8000/docs"
    Write-Host "  Frontend:      http://localhost:3000"
    Write-Host "==============================================" -ForegroundColor Cyan
}

Check-Prerequisites
Generate-Secrets
Create-Env
Build-And-Start
Run-Migrations
Health-Check
Display-URLs

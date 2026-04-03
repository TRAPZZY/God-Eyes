# God Eyes - Security Architecture

## Authentication & Authorization

### JWT Tokens
- Access tokens expire after 30 minutes (configurable)
- Refresh tokens expire after 7 days
- Tokens include user ID and role claims
- All tokens signed with HS256 algorithm

### Password Security
- bcrypt hashing with automatic salt generation
- Minimum 8 character password requirement
- Password change requires current password verification

### Role-Based Access Control
- **Operator**: Basic access - create locations, captures, view data
- **Analyst**: Extended access - analysis tools, reports
- **Admin**: Full access - user management, system administration
- **Superadmin**: Unrestricted access

## API Security

### Rate Limiting
- In-memory sliding window rate limiter
- Default: 60 requests per minute per IP
- Stricter limits on auth endpoints (5/min for login, 3/min for register)
- Resource-intensive endpoints limited (5/min for timelapse, 10/min for reports)
- X-RateLimit headers on all responses

### Security Headers
- `X-Content-Type-Options: nosniff` - Prevent MIME type sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` - Enable XSS filter
- `Strict-Transport-Security: max-age=31536000` - Enforce HTTPS
- `Content-Security-Policy: default-src 'self'` - Restrict resource loading
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Request Validation
- All inputs validated via Pydantic schemas
- Coordinate validation: lat -90 to 90, lon -180 to 180
- File upload validation: type, size, extension checks
- Request body size limited to 10MB
- XSS prevention: HTML tags stripped from user input
- Path traversal prevention in file operations

### SQL Injection Prevention
- All database queries use SQLAlchemy ORM
- Parameterized queries automatically
- No raw SQL execution in application code

## Data Protection

### Secrets Management
- All API keys stored in environment variables
- Never exposed in API responses
- JWT secret key must be regenerated for production
- Database passwords stored securely

### CORS
- Configurable allowed origins
- Credentials enabled for cookie-based auth
- All methods and headers allowed for configured origins

## Infrastructure Security

### Docker Security
- Non-root user in containers (production)
- Minimal base images (Alpine)
- Resource limits on all containers
- Health checks for all services

### Nginx Proxy
- SSL termination with Let's Encrypt
- Rate limiting at proxy level
- Request body size limits
- Static file caching with cache headers

## Security Checklist

- [ ] Generate strong JWT_SECRET_KEY (32+ hex chars)
- [ ] Set DEBUG=false in production
- [ ] Configure production CORS origins
- [ ] Enable SSL/TLS with valid certificates
- [ ] Use strong database passwords
- [ ] Rotate API keys regularly
- [ ] Monitor logs for suspicious activity
- [ ] Keep dependencies updated
- [ ] Run security audits regularly
- [ ] Implement backup and disaster recovery

## Incident Response

1. Identify the security issue
2. Revoke compromised tokens (change JWT_SECRET_KEY)
3. Rotate affected API keys
4. Review logs for scope of breach
5. Patch vulnerability
6. Notify affected users
7. Document incident and lessons learned

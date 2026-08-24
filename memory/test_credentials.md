# Lewi House — Test Credentials

## Admin (Owner)
- Email: admin@lewihouse.com
- Password: lewi2026
- Role: owner

## Auth Endpoints
- POST /api/auth/login {email, password} → returns {user, access_token} + httpOnly cookies
- GET /api/auth/me (Bearer or cookie)
- POST /api/auth/logout
- POST /api/auth/refresh

All other /api/* routes require authentication (Bearer token or cookie).
Frontend stores access_token in localStorage and sends Authorization: Bearer header.

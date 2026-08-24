# Auth Testing Playbook — Lewi House

## Credentials
- admin@lewihouse.com / lewi2026 (role: owner)

## Step 1: MongoDB Verification
```
mongosh
use lewi_house_db
db.users.find({role: "owner"}).pretty()
```
Verify: bcrypt hash starts with `$2b$`, unique index on users.email, index on login_attempts.identifier.

## Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@lewihouse.com","password":"lewi2026"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns {user, access_token} and sets access_token + refresh_token cookies.
Bearer header also works: `curl -H "Authorization: Bearer <token>" .../api/auth/me`

## Step 3: Protection check
`curl http://localhost:8001/api/rooms` without token → 401.

## Brute force
5 failed logins for same ip:email → 429 for 15 minutes.

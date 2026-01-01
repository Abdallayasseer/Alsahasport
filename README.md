# 📺 AlsahaSport Middleware & Reseller System

![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-9.x-green?style=flat&logo=mongodb)
![License](https://img.shields.io/badge/License-ISC-blue)
![Security](https://img.shields.io/badge/Security-Banking--Grade-red?style=flat&logo=security)

A high-performance **Middleware & Reseller Management System** for IPTV. This system acts as a secure bridge between your clients and an external IPTV Provider (Xtream Codes), featuring Zero-Trust architecture, automated line management, and banking-grade security.

---

## 🛠️ Key Features

- **🛡️ Secure Proxy Auth**: Clients authenticate against this middleware, which securely manages credentials for the upstream provider.
- **⚡ Automated Line Creation**: Creating a code locally triggers instant user creation on the external Xtream Codes panel.
- **🚫 Automated Banning**: Deleting a code locally automatically bans/deletes the line on the provider.
- **🔄 Smart Reseller Logic**: Manages activation codes, device locking, and session revocation.
- **🔒 Zero-Trust Architecture**:
  - **Stateful Sessions**: Active tracking of every connection.
  - **Device Fingerprinting**: Locks codes to specific devices.
  - **Rotation**: Secure Refresh Token implementation.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_WHITELIST=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/alsahasport

# External Provider (Reseller Config)
PROVIDER_API_URL=http://provider-dns.com
RESELLER_USERNAME=your_reseller_user
RESELLER_PASSWORD=your_reseller_pass

# Security Secrets (Use High Entropy strings!)
JWT_SECRET=super_secret_jwt_key
ACTIVATION_SECRET=super_secret_hash_salt
REFRESH_SECRET=super_secret_refresh_key

# Admin Seed
ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepassword
```

---

## 📚 API Documentation

### 👤 Authentication

| Method | Endpoint             | Description                  | Response                                 |
| ------ | -------------------- | ---------------------------- | ---------------------------------------- |
| `POST` | `/api/auth/activate` | Redeem Code & Login          | Returns Token + **Provider Credentials** |
| `POST` | `/api/auth/refresh`  | Rotate Access/Refresh Tokens | New Access Token                         |
| `POST` | `/api/auth/logout`   | Revoke Session               | Success                                  |

#### Login Response Structure

```json
{
  "success": true,
  "data": {
    "token": "jwt_access_token",
    "subscription": {
      "status": "Active",
      "host_url": "http://provider-dns.com",
      "username": "GENERATED_CODE_USER",
      "password": "GENERATED_CODE_USER"
    }
  }
}
```

### 🛠️ Administration

| Method   | Endpoint                      | Description                        | Access             |
| -------- | ----------------------------- | ---------------------------------- | ------------------ |
| `POST`   | `/api/admin/login`            | Dashboard Login                    | Public             |
| `POST`   | `/api/admin/codes`            | **Create Line** (Local + Provider) | Master/Daily Admin |
| `GET`    | `/api/admin/codes`            | List all codes                     | Master/Daily Admin |
| `DELETE` | `/api/admin/codes/:id`        | **Delete Line** (Local + Provider) | Master Admin       |
| `GET`    | `/api/admin/code/:id/display` | One-Time View of Raw Code          | Master/Daily Admin |
| `GET`    | `/api/admin/sessions/live`    | Monitor active middleware sessions | Master Admin       |

---

## 🚀 Installation

```bash
# 1. Clone
git clone https://github.com/your-repo/alsahasport-backend.git
cd alsahasport-backend

# 2. Install
npm install

# 3. Run
npm run dev
```

---

## 📂 Project Structure

```bash
src/
├── 📂 config/           # DB & Env Config
├── 📂 controllers/      # Orchestration (Admin <-> Service <-> Provider)
├── 📂 middlewares/      # Auth, RateLimit, Sanitize
├── 📂 models/           # MongoDB Schemas
├── 📂 routes/           # API Definitions
├── 📂 services/         # Business Logic (ProviderIntegration, AdminService)
├── 📂 utils/            # Encryption, Logger
└── 📜 app.js            # App Entry
```

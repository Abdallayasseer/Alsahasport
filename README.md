# 📺 AlsahaSport Backend API

![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-9.x-green?style=flat&logo=mongodb)
![License](https://img.shields.io/badge/License-ISC-blue)
![Security](https://img.shields.io/badge/Security-Banking--Grade-red?style=flat&logo=security)

A high-performance, banking-grade secure REST API for the AlsahaSport platform, built with Node.js, Express, and MongoDB. This system features Zero-Trust architecture, stateful session management, and robust role-based access control.

---

## 🛠️ Tech Stack & Dependencies

This project leverages a robust set of industry-standard packages to ensure security, stability, and performance.

### 🟢 Core & Database

| Package                                                                                                              | Version   | Description                                     |
| :------------------------------------------------------------------------------------------------------------------- | :-------- | :---------------------------------------------- |
| ![NodeJS](https://img.shields.io/badge/node.js-43853D?style=flat-square&logo=node.js&logoColor=white)                | `v20+`    | JavaScript Runtime Environment.                 |
| ![Express](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat-square&logo=express&logoColor=%2361DAFB) | `^5.2.1`  | Fast, unopinionated web framework for Node.js.  |
| ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white)            | `^9.0.2`  | Elegant MongoDB object modeling.                |
| ![Dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=flat-square&logo=dotenv&logoColor=black)                  | `^17.2.3` | Loads environment variables from `.env` file.   |
| ![CookieParser](https://img.shields.io/badge/cookie--parser-gray?style=flat-square)                                  | `^1.4.7`  | Parse Cookie header and populate `req.cookies`. |

### 🛡️ Security & Hardening

| Package                                                                                                         | Version  | Description                                          |
| :-------------------------------------------------------------------------------------------------------------- | :------- | :--------------------------------------------------- |
| ![Helmet](https://img.shields.io/badge/helmet-security-blue?style=flat-square&logo=security&logoColor=white)    | `^8.1.0` | Secures apps by setting various HTTP headers.        |
| ![Bcrypt](https://img.shields.io/badge/bcryptjs-red?style=flat-square&logo=lock&logoColor=white)                | `^3.0.3` | Optimized bcrypt for password hashing.               |
| ![JWT](https://img.shields.io/badge/jsonwebtoken-000000?style=flat-square&logo=json-web-tokens&logoColor=white) | `^9.0.3` | Implementation of JSON Web Tokens.                   |
| ![CORS](https://img.shields.io/badge/cors-success?style=flat-square)                                            | `^2.8.5` | Middleware to enable Cross-Origin Resource Sharing.  |
| ![RateLimit](https://img.shields.io/badge/express--rate--limit-orange?style=flat-square)                        | `^8.2.1` | Basic rate-limiting middleware for Express.          |
| ![MongoSanitize](https://img.shields.io/badge/express--mongo--sanitize-green?style=flat-square)                 | `^2.2.0` | Sanitizes inputs against MongoDB Operator Injection. |
| ![XSS](https://img.shields.io/badge/xss--clean-blue?style=flat-square)                                          | `^0.1.4` | Middleware to sanitize user input from XSS attacks.  |
| ![HPP](https://img.shields.io/badge/hpp-purple?style=flat-square)                                               | `^0.2.3` | Protection against HTTP Parameter Pollution attacks. |

### ⚡ Validation, Performance & Logging

| Package                                                                                       | Version   | Description                                            |
| :-------------------------------------------------------------------------------------------- | :-------- | :----------------------------------------------------- |
| ![Zod](https://img.shields.io/badge/zod-3E67B1?style=flat-square&logo=zod&logoColor=white)    | `^4.2.1`  | TypeScript-first schema declaration and validation.    |
| ![Validator](https://img.shields.io/badge/express--validator-blue?style=flat-square)          | `^7.3.1`  | Set of express.js middlewares that wraps validator.js. |
| ![Compression](https://img.shields.io/badge/compression-performance-orange?style=flat-square) | `^1.8.1`  | Node.js compression middleware (Gzip).                 |
| ![Winston](https://img.shields.io/badge/winston-logging-green?style=flat-square)              | `^3.19.0` | A logger for just about everything.                    |
| ![Morgan](https://img.shields.io/badge/morgan-logging-green?style=flat-square)                | `^1.10.1` | HTTP request logger middleware for node.js.            |

---

## 🔒 Enterprise-Grade Security Architecture

This project has been completely re-architected to meet strict security standards.

### 1. Zero-Trust Authentication

- **Stateful Sessions**: Unlike standard stateless JWTs, we track every active session in MongoDB (`Session` model). This allows for immediate revocation of access.
- **Token Rotation**: Implements a secure Refresh Token rotation powered by `cron`-like expiration handling and sliding windows.
- **Device Fingerprinting**: Tracks `deviceId`, IP address, and User-Agent to detect suspicious login attempts.

### 2. Role-Based Access Control (RBAC)

- **Granular Roles**: Distinct permissions for `MASTER_ADMIN`, `DAILY_ADMIN`, and standard `user` (Activation Code).
- **Middleware Enforcement**: Protected routes use `protect` and `restrictTo('ROLE')` middleware to ensure least-privilege access.

### 3. Atomic Code Redemption

- **Concurrency Safe**: Uses MongoDB transactions (or atomic `findOneAndUpdate`) to prevent "Race Conditions" where a single code could be used multiple times simultaneously.

### 4. Hardening & Optimization

- **Helmet**: Sets secure HTTP headers (CSP, HSTS, X-Frame-Options).
- **Rate Limiting**:
  - **Auth Limiter**: Strict limits on login/activation endpoints to prevent Brute Force.
  - **API Limiter**: General throttling for system stability.
- **Sanitization**:
  - `xss-clean`: Defends against Cross-Site Scripting.
  - `express-mongo-sanitize`: Prevents NoSQL Injection.
  - `hpp`: Prevents HTTP Parameter Pollution.
- **Validation**: strict **Zod** schemas for all inputs.

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/alsahasport-backend.git
cd alsahasport-backend
npm install

```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_WHITELIST=http://localhost:3000,[https://alsaha.com](https://alsaha.com)

# Database
MONGO_URI=mongodb://localhost:27017/alsahasport

# Security Secrets (Use High Entropy strings!)
JWT_SECRET=super_secret_jwt_key_here
ACTIVATION_SECRET=super_secret_hash_salt

# (Optional - Configurable in AuthService)
REFRESH_SECRET=super_secret_refresh_key
SESSION_EXPIRY=14d

# Default Admin Credentials (Seed)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepassword

```

### 3. Run Server

```bash
# Development (with Morgan logging)
npm run dev

# Production (Structured Winston logging)
node src/server.js

```

---

## 📚 API Documentation

### 👤 Authentication (Auth )

| Method | Endpoint               | Description                            | Access               |
| ------ | ---------------------- | -------------------------------------- | -------------------- |
| `POST` | `/api/auth/activate`   | Redeem code & strict device login      | Public               |
| `POST` | `/api/auth/refresh`    | **Rotate** Access/Refresh tokens       | Public (Cookie/Body) |
| `POST` | `/api/auth/validate`   | Verify session validity                | Authenticated        |
| `POST` | `/api/auth/logout`     | Revoke current session                 | Authenticated        |
| `POST` | `/api/auth/logout-all` | **Security Alert**: Revoke ALL devices | Authenticated        |

### 🛠️ Administration (Admin)

| Method | Endpoint                      | Description                   | Access             |
| ------ | ----------------------------- | ----------------------------- | ------------------ |
| `POST` | `/api/admin/login`            | Admin Dashboard Login         | Public             |
| `POST` | `/api/admin/codes`            | Generate new Activation Codes | Master/Daily Admin |
| `GET`  | `/api/admin/codes`            | List all codes                | Master/Daily Admin |
| `GET`  | `/api/admin/code/:id/display` | **One-Time** View of Raw Code | Master/Daily Admin |
| `GET`  | `/api/admin/sessions/live`    | Monitor active streams/users  | Master Admin       |
| `POST` | `/api/admin/channels`         | Add new IPTV Channel          | Master Admin       |

### 📺 Streaming (Stream)

| Method | Endpoint                  | Description                       | Access        |
| ------ | ------------------------- | --------------------------------- | ------------- |
| `GET`  | `/api/stream/channels`    | Get all available channels        | User (Active) |
| `GET`  | `/api/stream/categories`  | Get channel categories            | User (Active) |
| `GET`  | `/api/stream/channel/:id` | Get stream URL (Signed/Protected) | User (Active) |

---

## 📂 Project Structure

The project follows a modular **Controller-Service-Repository** pattern to ensure separation of concerns and maintainability.

```bash
src/
├── 📂 config/           # Database connection & environment configuration
├── 📂 controllers/      # Request orchestration & response handling
├── 📂 middlewares/      # Global & route-specific middlewares (Auth, RateLimit)
├── 📂 models/           # Mongoose schemas & data models
├── 📂 routes/           # API route definitions
├── 📂 services/         # Core business logic & complex operations
├── 📂 utils/            # Helper functions (Logger, AppError, Encryption)
├── 📂 validations/      # Zod schemas for strict request validation
└── 📜 app.js            # Express application setup & middleware chain
```

```

---

## 📝 Conclusion

The **Alsaha Sport Backend** is engineered for high-security IPTV management, prioritizing atomic operations and strict device-based authentication. By leveraging a robust middleware stack and role-based access control, it ensures a secure and scalable environment for managing activation codes and streaming services.

For further inquiries or support, please refer to the internal documentation or contact the development team.
```

# 📺 AlsahaSport Backend API

![Node.js](https://img.shields.io/badge/Node.js-v14%2B-green?style=flat&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat&logo=mongodb)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat)

> A robust, high-performance backend service engineered for the **AlsahaSport** streaming platform.

This system facilitates secure streaming sessions, manages subscription codes with expiration logic, provides real-time user monitoring, and offers a comprehensive administration dashboard.

---

## 📑 Table of Contents
- [Features](#-features)
- [Security Implementation](#-security-implementation)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-configuration)
- [API Documentation](#-api-endpoints)
- [Testing & Postman](#-testing-with-postman)
- [License](#-license)

---

## 🚀 Features

### 🔐 Auth & Identity
* **JWT Authentication:** Stateless, secure authentication for both Clients and Admins.
* **Role-Based Access:** Distinct permissions for Master Admin, Daily Admin, and Users.

### 📡 Streaming & Content
* **Dynamic Channels:** API endpoints to fetch channels categorized by genre.
* **Secure Links:** Delivers protected stream URLs to authenticated clients.
* **Provider Management:** Manage different stream sources seamlessly.

### 🕹️ Administration
* **Code System:** Generate, track, and revoke subscription codes.
* **Live Monitoring:** **Real-time** tracking of active user sessions.
* **Dashboard API:** Full control over content and users.

---

## 🛡️ Security Implementation

This project follows a **Security-First** architecture, implementing rigorous measures to protect data and infrastructure.

### 1️⃣ Dependency Hardening
We utilize specialized middleware to sanitize inputs and prevent common attacks:
* **NoSQL Injection:** `express-mongo-sanitize` removes prohibited characters (like `$`) to prevent database injection.
* **XSS Protection:** `xss-clean` sanitizes user input against malicious HTML scripts.
* **Parameter Pollution:** `hpp` protects against HTTP Parameter Pollution attacks.
* **Input Validation:** `express-validator` ensures strict data type enforcement on all endpoints.

### 2️⃣ Traffic Control (Rate Limiting)
To prevent Brute-Force attacks and DoS attempts, we enforce strict limits:
* **Auth Routes (Login/Activate):** Limit of **10 requests per hour** per IP.
* **General API:** Standard limit of **100 requests per 15 minutes**.

### 3️⃣ Network & Header Security
* **Helmet:** Sets secure HTTP headers to protect against well-known web vulnerabilities.
* **CORS:** Restricted access policy allowing requests only from trusted domains (Production Frontend).
* **Sanitization:** Automatic cleaning of request body, query, and params before processing.

---

## 🛠 Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js | JavaScript runtime built on Chrome's V8 engine. |
| **Framework** | Express.js | Fast, unopinionated, minimalist web framework. |
| **Database** | MongoDB | NoSQL database with **Mongoose** ODM. |
| **Auth** | JWT | JSON Web Tokens for stateless authentication. |
| **Security** | BcryptJS | Password hashing. |
| **Logging** | Morgan | HTTP request logger middleware. |

---

## 📂 Project Structure

```bash
alsahasport-backend/
├── src/
│   ├── config/         # Database and Env configurations
│   ├── controllers/    # Request logic (Auth, Stream, Admin)
│   ├── models/         # Mongoose Schemas (User, Code, Channel)
│   ├── routes/         # API Routes definitions
│   ├── middleware/     # Auth checks, Error handling, Rate Limiters
│   └── utils/          # Helper functions
├── .env.example        # Environment variables template
├── server.js           # Entry point
└── package.json        # Dependencies

```

---

## ⚡ Getting Started

### Prerequisites

* Node.js (v14 or higher)
* MongoDB (Local or Atlas URL)
* Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Abdallayasseer/Alsahasport.git
cd alsahasport-backend

```

2. **Install Dependencies**

```bash
npm install

```

3. **Run the Server**

```bash
# Development Mode (with nodemon)
npm run dev

# Production Mode
npm start

```

---

## 🔐 Environment Configuration

Create a `.env` file in the root directory. You can use the reference below:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/alsahasport

# Security & Authentication
# Use a long, random string for JWT signing
JWT_SECRET=your_jwt_secret_key_here

# Administrator Credentials
ADMIN_USERNAME=alsahasportadmin
ADMIN_PASSWORD=your_secure_admin_password
DAILY_ADMIN_USERNAME=dailyadmin
DAILY_ADMIN_PASSWORD=your_secure_daily_password

```

---

## 📚 API Endpoints

### 👤 Client Authentication

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/activate` | Activate subscription code & get token. | ❌ |
| `POST` | `/api/auth/validate` | Validate current session token. | ✅ |
| `POST` | `/api/auth/logout` | Terminate session. | ✅ |

### 🛠️ Admin Dashboard

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/admin/login` | Admin login. | ❌ |
| `POST` | `/api/admin/codes` | Create new subscription codes. | ✅ |
| `GET` | `/api/admin/codes` | Retrieve all codes. | ✅ |
| `DELETE` | `/api/admin/code/:id` | Delete a code. | ✅ |
| `GET` | `/api/admin/sessions/live` | **Monitor live active users.** | ✅ |
| `POST` | `/api/admin/channels` | Add TV channel. | ✅ |
| `POST` | `/api/admin/provider` | Add stream provider. | ✅ |

### 📺 Streaming

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/stream/channels` | List all channels (filter by category). | ✅ |
| `GET` | `/api/stream/categories` | List available categories. | ✅ |
| `GET` | `/api/stream/channel/:id` | Get secure stream URL. | ✅ |

---

## 🧪 Testing with Postman

A fully automated Postman collection is included in this repository: `Alsaha.postman_collection.json`.

### How to use:

1. Import the collection into Postman.
2. Ensure the environment variable `{{base_url}}` is set to `http://localhost:5000/api`.

### 🤖 Automation Features:

* **Auto-Token Injection:** When you run the **Activate Code** or **Admin Login** request, the system automatically captures the `token` from the response and saves it to the Collection Variables.
* **No Copy-Paste Needed:** All subsequent requests (like getting channels) will automatically use the saved token.

---

## 📄 License

This project is licensed under the **ISC License**.

---

**Developed by Abdullah Yasser**
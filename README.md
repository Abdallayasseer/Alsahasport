# 📺 Alsaha Sport - IPTV & Streaming Backend Engine

![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg) ![Express](https://img.shields.io/badge/Express-v4.18-blue.svg) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-forestgreen.svg) ![JWT](https://img.shields.io/badge/Auth-JWT-orange.svg)

> A robust, high-performance backend system for IPTV streaming services. Featuring a **secure activation-code authentication system** and **Single-Device Locking mechanism** to prevent piracy and account sharing.

---

## 🚀 Key Features

### 🔐 Advanced Security & Auth
- **Code-Based Login:** No email/password required. Users log in via purchased Activation Codes.
- **Single Device Lock (SDL):** Smart session management that strictly enforces one active device per code. Logging in from a new device automatically invalidates the previous session.
- **JWT Authentication:** Secure stateless authentication for API access.
- **Device Fingerprinting:** Binds sessions to IP and User-Agent.

### ⚙️ Admin Dashboard Capabilities
- **Code Generation Engine:** Bulk generate codes with specific durations (30, 90, 365 days).
- **Live Monitoring:** Real-time tracking of active online sessions.
- **Content Management:** Manage channels, categories, and stream providers (Xtream/M3U).
- **User Control:** Ban codes, force logout, or delete users instantly.

### 📡 Streaming Logic
- **HLS Support:** Optimized for `.m3u8` streaming.
- **Dynamic Categories:** Auto-grouping of channels (Sports, Movies, Kids).
- **Heartbeat System:** Frontend periodically validates session validity to ensure active subscription status.

---

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) (via Mongoose ODM)
- **Security:** Helmet, CORS, Express-Rate-Limit, Bcrypt, JWT
- **Logging:** Morgan

---

## 📂 Project Structure

The project follows a scalable **MVC (Model-View-Controller)** architecture.

```bash
alsaha-backend/
├── src/
│   ├── config/             # DB connection & env setup
│   ├── controllers/        # Business logic (Auth, Admin, Stream)
│   ├── middlewares/        # Auth protection, Error handling
│   ├── models/             # Mongoose Schemas (Code, Session, Channel)
│   ├── routes/             # API Endpoints
│   ├── utils/              # Helper functions (Response, Validator)
│   └── app.js              # Express App setup
├── seeder.js               # Database seeder (Create Initial Admin)
├── server.js               # Entry point
└── .env                    # Environment variables

```

---

## ⚡ Getting Started

### 1. Prerequisites

* Node.js (v14 or higher)
* MongoDB (Local or Atlas)

### 2. Installation

```bash
# Clone the repository
git clone [https://github.com/Abdallayasseer/Alsahasport.git](https://github.com/Abdallayasseer/Alsahasport.git)

# Navigate to directory
cd Alsahasport

# Install dependencies
npm install

```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/alsaha_sport
JWT_SECRET=YourSuperSecretKeyHere_123!
ADMIN_USERNAME=AdminUserName
ADMIN_PASSWORD=AdminPass
NODE_ENV=development

```

### 4. Database Seeding (First Run Only)

Since the system requires an Admin to generate codes, run this script to create the first Admin user:

```bash
# Creates admin user: username: 'admin', password: '123456'
node seeder.js

```

### 5. Run the Server

```bash
# Development mode (with Nodemon)
npm run dev

# Production mode
npm start

```

---

## 📖 API Documentation

### 🟢 Authentication (Public)

| Method | Endpoint | Description | Body Parameters |
| --- | --- | --- | --- |
| `POST` | `/api/auth/activate` | User Login | `{ "code": "ABC", "deviceId": "xyz" }` |
| `POST` | `/api/admin/login` | Admin Login | `{ "username": "admin", "password": "..." }` |

### 🔒 User Operations (Requires Token)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/validate` | Heartbeat check (sent every 2 mins) |
| `POST` | `/api/auth/logout` | End session manually |
| `GET` | `/api/stream/channels` | Get all channels |
| `GET` | `/api/stream/categories` | Get category list |
| `GET` | `/api/stream/channel/:id` | Get stream URL for specific channel |

### 🛡️ Admin Management (Requires Admin Token)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/codes` | Generate new activation code |
| `GET` | `/api/admin/codes` | List all codes |
| `DELETE` | `/api/admin/code/:id` | Delete a code |
| `GET` | `/api/admin/sessions/live` | View currently active sessions |
| `POST` | `/api/admin/channels` | Add a new channel |
| `POST` | `/api/admin/provider` | Add Stream Provider (Xtream) |

---

## 🛡️ Security Logic Explained

### The "Single Device" Problem

In IPTV, users often share codes, causing loss of revenue.

### Our Solution

1. **Login:** When a user enters a code, the backend checks the `Sessions` collection.
2. **Conflict:** If a session exists for that code (even on another IP), it is **deleted**.
3. **New Session:** A new session is created for the *current* device.
4. **The Old User:** The old device sends a heartbeat (`/validate`) request. Since the session was deleted, the backend returns `401 Unauthorized`, and the frontend forces a logout.

---

## 🤝 Contributing

1. Fork the repository.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed by Eng. Abdallah Yasser** *Full Stack Developer (Node.js & React)*
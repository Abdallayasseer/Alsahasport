# 🏆 Alsahasport Backend API

![Node.js](https://img.shields.io/badge/Node.js-V22-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Railway](https://img.shields.io/badge/Deployed%20on-Railway-purple?style=for-the-badge&logo=railway)

## Overview

AlsahaSport is a robust, production-grade IPTV/Streaming backend system built with Node.js and MongoDB. It manages activation codes, live user sessions, and secure stream delivery with a focus on high-performance and strict security.

The system features a dual-authentication mechanism:

1.  **Admin Portal**: Secure JWT-based access for system administrators (rbac: MASTER_ADMIN, DAILY_ADMIN).
2.  **Streaming Clients**: Code-based activation system where users enter a purchased code to gain access for a specific duration (30/90/365 days).

## Key Features

- **Secure Authentication**: JWT-based auth with secure headers (Helmet), Rate Limiting, and CORS protection.
- **Role-Based Access Control (RBAC)**: Granular permissions for Master and Daily admins.
- **Activation System**: Logic to handle code usage, expiration, bans, and device locking (1 session per code).
- **Session Management**: Real-time tracking of live sessions to prevent account sharing.
- **Stream Management**: Categorized channel lists and secure stream URL delivery.
- **Security**: NoSQL injection protection, Centralized Error Handling, and Input Sanitization.

---

## 🏗 System Architecture

### Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: Helmet, CORS, RateLimit, Bcrypt, JWT, MongoSanitize
- **Logging**: Morgan (Dev mode)

### Folder Structure

```
src/
├── config/         # Database connection
├── controllers/    # Request handlers (Admin, Auth, Stream)
├── middlewares/    # Auth, Error Handling, Validation
├── models/         # Mongoose Schemas (Admin, Channel, Code, Session)
├── routes/         # API Routes definition
├── utils/          # Helpers (AppError, catchAsync)
└── app.js          # Express App setup & Global Middleware
```

---

## 🛡 Admin Roles & Permissions

| Feature                     | MASTER_ADMIN | DAILY_ADMIN |
| :-------------------------- | :----------: | :---------: |
| **Login**                   |      ✅      |     ✅      |
| **View Live Sessions**      |      ✅      |     ❌      |
| **Create Activation Codes** |      ✅      |     ✅      |
| **View All Codes**          |      ✅      |     ✅      |
| **Delete Code**             |      ✅      |     ❌      |
| **Add Channel**             |      ✅      |     ❌      |
| **Add Stream Provider**     |      ✅      |     ❌      |

---

## 🔐 API Overview

### 1. Authentication (User/Streamer)

- `POST /api/auth/activate`: Activate a code to get a session token. Checks expiry/ban status.
- `POST /api/auth/validate`: Heartbeat to keep session alive.
- `POST /api/auth/logout`: End session.

### 2. Admin Management

- `POST /api/admin/login`: Admin login.
- `POST /api/admin/codes`: Create new activation codes.
- `GET /api/admin/codes`: List all codes.
- `DELETE /api/admin/code/:id`: Remove a code (Master Only).
- `GET /api/admin/sessions/live`: View active user sessions (Master Only).
- `POST /api/admin/channels`: Add new channels (Master Only).

### 3. Streaming (Protected)

- `GET /api/stream/channels`: Get list of active channels.
- `GET /api/stream/categories`: Get distinct categories.
- `GET /api/stream/channel/:id`: Get secure stream URL for a channel.

---

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/alsahasport/backend.git
    cd backend
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:

    ```env
    NODE_ENV=development
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/alsahasport
    JWT_SECRET=your_super_secret_jwt_key_should_be_long
    ```

4.  **Run the Server**

    ```bash
    # Development Mode (Nodemon)
    npm run dev

    # Production Mode
    npm start
    ```

---

## 🧪 Postman Usage

A complete Postman collection is included as `Alsaha_Full_System.postman_collection.json`.

1.  Import the JSON file into Postman.
2.  The collection uses **Variables**:
    - `{{base_url}}`: Defaults to `http://localhost:5000/api`
    - `{{token}}`: Automatically set this after Login/Activate requests if you use scripts, or manually copy the Bearer token.
3.  **To Test Admin Flow**:
    - Login as Admin -> Copy `token` -> Paste in Authorization tab of Admin requests.
4.  **To Test User Flow**:
    - Activate Code -> Copy `token` -> Paste in Authorization tab of Stream requests.

---

## 📄 License

Private Property of AlsahaSport. Unauthorized copying or distribution is strictly prohibited.

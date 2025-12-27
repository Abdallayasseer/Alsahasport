# 🏆 Alsahasport Backend API

![Node.js](https://img.shields.io/badge/Node.js-V22-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Railway](https://img.shields.io/badge/Deployed%20on-Railway-purple?style=for-the-badge&logo=railway)

**Alsahasport** is a robust, high-performance RESTful API designed to manage a sports streaming platform. It features a secure subscription system based on activation codes with strict **Single-Device Session Locking** and a tiered **Role-Based Access Control (RBAC)** system for administration.

---

## 🚀 Key Features

### 🔐 Security & Authentication
- **Single Device Policy:** The system enforces a strict "One Device Per Code" rule. If a code is used on a new device, the previous session is automatically terminated (Session Killing).
- **JWT Authentication:** Secure stateless authentication using JSON Web Tokens.
- **Role-Based Access Control (RBAC):**
  - 🔴 **Master Admin:** Full control (Manage admins, delete data, view financials).
  - 🟡 **Daily Admin:** Operational control (Generate codes, suspend users, view stats).
- **Password Encryption:** Admins' passwords are hashed using `bcryptjs`.

### 📦 Code Management
- **Activation Codes:** Generate codes with specific durations (30, 90, 365 days).
- **Status Tracking:** Auto-update status (`active`, `expired`, `banned`, `unused`).
- **Heartbeat System:** Validate active sessions in real-time.

### 📺 Stream Management
- **Channel Organization:** Manage channels, categories, and logos.
- **Provider Integration:** Structure ready for Xtream/M3U providers.
- **Hybrid Protection:** Allows both subscribed users and admins to preview streams.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Security:** Helmet, CORS, Bcrypt, JWT
- **Deployment:** Railway (CI/CD connected to GitHub)

---

## 📂 Project Structure

```bash
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

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/alsaha_sport
JWT_SECRET=YourSuperSecretKeyHere_123!
ADMIN_USERNAME=AdminUserName
ADMIN_PASSWORD=AdminPass
DAILY_ADMIN_USERNAME=staffusername
DAILY_ADMIN_PASSWORD=staffPass
NODE_ENV=development


```

---

## 🔌 API Endpoints Documentation

### 1. Authentication (User)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/activate` | Activate a code & log in (Auto-locks device) |
| `POST` | `/api/auth/validate` | Check if session is still valid (Heartbeat) |
| `POST` | `/api/auth/logout` | Kill current session |

### 2. Admin Management (RBAC)

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/admin/login` | Public | Admin Login |
| `POST` | `/api/admin/create` | **Master** | Create new admin (Staff) |
| `DELETE` | `/api/admin/:id` | **Master** | Delete an admin |
| `GET` | `/api/admin/profits` | **Master** | View financial stats |

### 3. Subscription Codes

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/codes` | **Master/Daily** | Generate new codes |
| `GET` | `/api/codes` | **Master/Daily** | List all codes |
| `PATCH` | `/api/codes/:id/suspend` | **Master/Daily** | Ban/Suspend a code |
| `DELETE` | `/api/codes/:id` | **Master** | Permanently delete code |

### 4. Streaming Content

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/stream/channels` | **User/Admin** | Get all channels |
| `GET` | `/api/stream/categories` | **User/Admin** | Get categories |
| `POST` | `/api/stream` | **Master** | Add new channel |

---

## 🛡️ Security Logic Explained

### The "Device Lock" Mechanism

When a user calls `/api/auth/activate`:

1. System checks if code is valid.
2. Checks for any **existing active session** for this code in the `Sessions` collection.
3. If found -> **Deletes the old session** (Kicking out the previous user).
4. Creates a new session with the current `DeviceID` and `IP`.
5. Returns a JWT token linked to this specific session ID.

---

## 🚀 Deployment

The API is currently live on **Railway**:

* **Base URL:** `https://alsahasport-production.up.railway.app/api`

---

## 👨‍💻 Author

**Abdallah Yasser**

* Full Stack Developer (MERN Stack)
* [GitHub Profile](https://www.google.com/search?q=https://github.com/Abdallayasseer)

---

*© 2025 Alsahasport Backend System.*
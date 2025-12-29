# AlsahaSport Backend API

A robust Node.js/Express backend service for the AlsahaSport streaming platform. This system manages authentication, subscription codes, live stream sessions, and admin controls.

## 🚀 Features

- **Authentication**: Secure JWT-based authentication for both Clients and Admins.
- **Code Management**: Generate, retrieve, and delete subscription codes.
- **Streaming Handlers**: API endpoints to fetch channels, categories, and secure stream URLs.
- **Session Monitoring**: Real-time tracking of live user sessions.
- **Admin Dashboard**: Comprehensive API for managing content and users.
- **Security**: Implements Rate Limiting, Helmet headers, and Mongo Sanitization.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose)
- **Authentication**: JSON Web Token (JWT)
- **Security**: `helmet`, `express-rate-limit`, `mongo-sanitize`, `bcryptjs`
- **Logging**: `morgan` (in development)

## ⚙️ Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <repository_url>
   cd alsahasport-backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:

   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=mongodb://localhost:27017/alsahasport
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=30d
   LOGIN_PASSWORD=securepassword # For simple admin login if used
   ```

4. **Start the Server**
   - Development Mode:
     ```bash
     npm run dev
     ```
   - Production Mode:
     ```bash
     npm start
     ```

## 📚 API Endpoints

### Auth (Client)

| Method | Endpoint             | Description                                       | Auth Required |
| :----- | :------------------- | :------------------------------------------------ | :------------ |
| `POST` | `/api/auth/activate` | Activate a subscription code and receive a token. | No            |
| `POST` | `/api/auth/validate` | Validate the current session token.               | Yes           |
| `POST` | `/api/auth/logout`   | Logout the current user/device.                   | Yes           |

### Admin

| Method   | Endpoint                   | Description                            | Auth Required      |
| :------- | :------------------------- | :------------------------------------- | :----------------- |
| `POST`   | `/api/admin/login`         | Admin login to receive an admin token. | No                 |
| `POST`   | `/api/admin/codes`         | Create new subscription codes.         | Yes (Master/Daily) |
| `GET`    | `/api/admin/codes`         | Retrieve all subscription codes.       | Yes (Master/Daily) |
| `DELETE` | `/api/admin/code/:id`      | Delete a subscription code.            | Yes (Master)       |
| `GET`    | `/api/admin/sessions/live` | View currently active live sessions.   | Yes (Master)       |
| `POST`   | `/api/admin/channels`      | Add a new TV channel.                  | Yes (Master)       |
| `POST`   | `/api/admin/provider`      | Add a new stream provider.             | Yes (Master)       |

### Stream

| Method | Endpoint                  | Description                                                 | Auth Required |
| :----- | :------------------------ | :---------------------------------------------------------- | :------------ |
| `GET`  | `/api/stream/channels`    | Get list of available channels (optional `category` query). | Yes           |
| `GET`  | `/api/stream/categories`  | Get list of available stream categories.                    | Yes           |
| `GET`  | `/api/stream/channel/:id` | Get secure stream URL for a specific channel.               | Yes           |

## 🧪 Testing with Postman

An automated Postman collection is included (`Alsaha.postman_collection.json`).

1. Import the collection into Postman.
2. Select the "Alsaha System" collection.
3. The collection is configured to use the variable `{{base_url}}`. Default is `http://localhost:5000/api`.
4. **Automation**:
   - When you request **Auth > Activate Code** or **Admin > Admin Login**, the response token is automatically saved to the `{{token}}` collection variable.
   - Subsequent authenticated requests will automatically use this token.

## 📄 License

This project is licensed under the ISC License.

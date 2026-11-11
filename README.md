# Saraha App – Authentication & User Management API

A RESTful backend built with **Node.js** and **Express 5**. It covers user sign-up, login with JWT access/refresh tokens, Google Sign-In, email confirmation with OTP, profile image upload, and role-based authorization.

> Built while learning Node.js at Route Academy.

## Features

- **Sign-up and login** with email or username, plus a refresh-token endpoint.
- **JWT authentication**: short-lived access tokens and 7-day refresh tokens.
- **Google Sign-In** by verifying Google ID tokens on the server.
- **Session management with Redis**: every login gets a unique token ID (`jti`) saved in Redis and checked on each protected request.
- **Logout** from the current device or from all devices.
- **Email confirmation** with a one-time password (OTP) sent through Nodemailer. The OTP is hashed and stored in Redis with an expiry time, and there is a resend cooldown.
- **Brute-force protection** on OTP confirmation: limited attempts, then escalating temporary blocks tracked in Redis.
- **Forgot / reset password** flow that emails an OTP.
- **Role-based authorization** middleware (user / admin).
- **Request validation** with Zod, and a centralized error handler.
- **Sensitive data protection**: passwords hashed with bcrypt, phone numbers encrypted with AES-256-CBC before saving.
- **Messages module**: send a message with up to 5 images to a user (Multer).
- **Profile image upload** with Multer, saved in a folder per user.

## Tech Stack

| Area | Tools |
| --- | --- |
| Runtime / Framework | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Cache / OTP storage | Redis |
| Auth | JWT (jsonwebtoken), google-auth-library |
| Validation | Zod |
| Email | Nodemailer |
| Uploads | Multer |
| Security | bcrypt, Node `crypto` (AES-256-CBC) |

## Project Structure

```
src/
├── bootstrap.js            # Express app setup
├── DB/
│   ├── DB.connection.js    # MongoDB connection
│   ├── redis.connect.js    # Redis client
│   └── models/             # Mongoose models and enums
├── middlewares/            # auth, authorization, validation
├── modules/user/           # controller, services, validation
└── utils/                  # email, security, multer, response helpers
```

## Getting Started

### Requirements

- Node.js 20 or newer
- MongoDB running locally on `mongodb://localhost:27017`
- Redis running locally on `redis://127.0.0.1:6379`

### Installation

```bash
git clone https://github.com/Karim-Shaat/sarahaApp.git
cd sarahaApp
npm install
```

### Environment variables

Copy `config/.env.example` to `config/.env` and fill in your own values:

| Variable | Description |
| --- | --- |
| `PORT` | Port the server listens on |
| `ACCESS_TOKEN_SECRET` | Secret used to sign access tokens |
| `REFRESH_TOKEN_SECRET` | Secret used to sign refresh tokens |
| `CLIENT_ID` | Google OAuth client ID |
| `USER` | Gmail address used to send emails |
| `PASSWORD` | Gmail app password |

### Run

```bash
npm run start:dev
```

## API Endpoints

Base paths: `/users` and `/messages`

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/signup` | Create an account and send a confirmation OTP | No |
| POST | `/resend-confirm-otp` | Send a new confirmation OTP (with cooldown) | No |
| PATCH | `/confirm-email` | Confirm the email with the OTP | No |
| POST | `/login` | Login with email/username and password | No |
| POST | `/refresh-token` | Get a new access token | Refresh token |
| POST | `/signup/gmail` | Sign in or sign up with a Google ID token | No |
| GET | `/me` | Get the logged-in user | Access token |
| PATCH | `/forget-password` | Send a reset OTP to the email | No |
| PATCH | `/reset-password` | Set a new password | No |
| GET | `/upload-file` | Upload a profile image (form-data field: `image`) | Access token |
| POST | `/logout-from-one-device` | Logout from the current device | Access token |
| POST | `/logout-from-all-devices` | Logout from all devices | Access token |
| POST | `/messages/send` | Send a message with up to 5 images (form-data: `content`, `to`, `images`) | No |

Send tokens in the header: `Authorization: Bearer <token>`

### Example: sign up

```json
POST /users/signup
{
  "fullName": "Ahmed Ali",
  "email": "ahmed@example.com",
  "userName": "ahmed99",
  "phone": "01012345678",
  "password": "Pass@1234",
  "confirmPassword": "Pass@1234",
  "gender": 0
}
```

### Example: login

```json
POST /users/login
{
  "identifier": "ahmed99",
  "password": "Pass@1234"
}
```

Access tokens are short-lived, so use `/refresh-token` to get a new one.

## Author

**Karim Ibrahim**
[GitHub](https://github.com/Karim-Shaat) · [LinkedIn](https://www.linkedin.com/in/karim-shaat-6a0609205/)

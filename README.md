# Notify Backend

A Node.js backend application using TypeScript, Express, and MongoDB with JWT authentication.

## Features

- TypeScript for type safety
- Express.js web framework
- MongoDB with Mongoose ODM
- JWT authentication with 10 days token validity
- Password hashing with bcrypt

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or a connection string)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed

## Running the Application

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

- **GET** `/health`
- Returns server status

### Authentication

#### Register

- **POST** `/api/auth/register`
- Body:

```json
{
  "phoneNumber": "+1234567890",
  "password": "yourpassword",
  "name": "John Doe" // optional
}
```

#### Login

- **POST** `/api/auth/login`
- Body:

```json
{
  "phoneNumber": "+1234567890",
  "password": "yourpassword"
}
```

- Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "phoneNumber": "+1234567890",
      "name": "John Doe"
    }
  }
}
```

## Environment Variables

| Variable       | Description                | Default                             |
| -------------- | -------------------------- | ----------------------------------- |
| PORT           | Server port                | 3000                                |
| MONGODB_URI    | MongoDB connection string  | mongodb://localhost:27017/notify-db |
| JWT_SECRET     | Secret key for JWT signing | -                                   |
| JWT_EXPIRES_IN | JWT token validity         | 10d                                 |

## Project Structure

```
src/
├── config/
│   ├── db.ts          # MongoDB connection
│   └── env.ts         # Environment configuration
├── controllers/
│   └── authController.ts  # Authentication logic
├── middleware/
│   └── auth.ts        # JWT authentication middleware
├── models/
│   └── User.ts        # User model
├── routes/
│   └── authRoutes.ts  # Auth routes
├── utils/
│   └── jwt.ts         # JWT utilities
└── index.ts           # Application entry point
```

import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/notify-db",
  jwtSecret: process.env.JWT_SECRET || "default-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "10d",
};

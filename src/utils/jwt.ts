import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/env";

interface TokenPayload {
  userId: string;
  phoneNumber: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: "10d", // 10 days validity
  };
  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

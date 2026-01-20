import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/jwt";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
      return;
    }

    const user = await User.findOne({ phoneNumber }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
      return;
    }

    const accessToken = generateToken({
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, password, name } = req.body;

    if (!phoneNumber || !password) {
      res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
      return;
    }

    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this phone number already exists",
      });
      return;
    }

    const user = await User.create({
      phoneNumber,
      password,
      name,
    });

    const accessToken = generateToken({
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        accessToken,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

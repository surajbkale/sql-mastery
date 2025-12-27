import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { signupSchema, loginSchema } from "@repo/types";
import {
  hashPassword,
  comparePassword,
  generateToken,
  cookieOptions,
} from "../utils/auth";

export const signup = async (req: Request, res: Response) => {
  try {
    const parsedData = signupSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        error: parsedData.error.format(),
      });
    }

    const { email, password, name } = parsedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        // provider: "email",
      },
    });

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "Signup successfull",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Signup error: ", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({
        error: "Invalid input",
      });
    }
    const { email, password } = parsedData.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    return res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Login error: ", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token", cookieOptions);
  return res.json({
    message: "Logged out successfully",
  });
};

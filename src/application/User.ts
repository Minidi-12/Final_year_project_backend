import { Request, Response } from "express";
import User from "../infrastructure/db/entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema } from "../domain/dto/Userdto";

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    const { email, password, role } = validatedData;

    // Find user by email AND role
    const user = await User.findOne({ email, role });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // Return success response
    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        role: user.role,
        email: user.email,
        isFirstLogin: user.isFirstLogin,
      },
    });

  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        message: err.errors[0].message,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};
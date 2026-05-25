import { Request, Response } from "express";
import User from "../infrastructure/db/entities/User";
import GnOfficer from "../infrastructure/db/entities/Gnofficer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema } from "../domain/dto/Userdto";

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password, role } = validatedData;

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    let gnDivision = null;
    let gnOfficerId = null;

    if (user.role === "GN_OFFICER") {
      const officer = await GnOfficer.findOne({ user_id: user._id })
        .populate("gn_division_id");
      
        console.log("officer found:", officer);
        console.log("gn_division_id populated:", officer?.gn_division_id);

      if (officer) {
        gnOfficerId = officer._id;
        gnDivision  = (officer.gn_division_id as any)?.gn_division_Name || null;
      }
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id:           user._id,
        name:         user.name,
        role:         user.role,
        email:        user.email,
        isFirstLogin: user.isFirstLogin,
        gnDivision,      
        gnOfficerId,     
      },
    });

  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({ message: err.errors[0].message });
    }
    res.status(500).json({ message: "Server error" });
  }
};
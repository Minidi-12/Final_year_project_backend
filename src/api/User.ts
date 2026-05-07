import express from "express";
import { login } from "../application/User";
import UserModel from "../infrastructure/db/entities/User"; 

const router = express.Router();

router.post("/login", login);

router.get("/users", async (req, res) => {
  const users = await UserModel.find({}, { password: 0 });
  res.json(users);
});

export default router;
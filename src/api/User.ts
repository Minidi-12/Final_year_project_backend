import express from "express";
import { login } from "../application/User";
import { protect, requireRole } from "./middleware/authMiddleware";

const router = express.Router();

router.post("/login", login);

export default router;
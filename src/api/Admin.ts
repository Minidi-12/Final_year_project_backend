import express from "express";
import { createUser } from "../application/Admin";

const router = express.Router();

router.post("/create-user", createUser);

export default router;
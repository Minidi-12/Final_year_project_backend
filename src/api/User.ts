import express from "express";
import { login } from "../application/User";
const router = express.Router();

router.post("/login", login);



export default router;
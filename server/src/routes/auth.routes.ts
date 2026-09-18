import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();
const basePath = "/auth";

const registerRoute = `${basePath}/register`;
// const logoinRoute = `${basePath}/login`;

router.post(registerRoute, registerUser);
// router.post(logoinRoute, loginUser);

export default router;
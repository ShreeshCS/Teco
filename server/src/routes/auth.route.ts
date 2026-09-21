import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";

const router = Router(); // TODO: instead of having multiple instances of router in the server, try sharing instance from one place
const basePath = "/auth";

const registerRoute = `${basePath}/register`;
const logoinRoute = `${basePath}/login`;

router.post(registerRoute, registerUser);
router.post(logoinRoute, loginUser);

export default router;
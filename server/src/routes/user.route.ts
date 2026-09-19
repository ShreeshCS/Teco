import { Router } from "express";
import { getUsers } from "../controllers/user.controller.js";

const router = Router();
const basePath = "/users";

const getUsersRoute = `${basePath}/all`;

router.get(getUsersRoute, getUsers);

export default router;
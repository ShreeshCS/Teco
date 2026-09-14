import { Router } from "express";
import { getUsers } from "../controllers/user.controller.js";

const router = Router();
const basePath = "/users";

router.get(`${basePath}/all`, getUsers);

export default router;
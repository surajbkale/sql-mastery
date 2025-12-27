import { Router } from "express";
import { signup, login, logout } from "../controller/auth.controller";

const router: Router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;

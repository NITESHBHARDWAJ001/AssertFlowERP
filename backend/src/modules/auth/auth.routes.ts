import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from "./auth.validators";
import { forgotPassword, getMe, login, logout, refresh, resetPassword } from "./auth.controller";

const router = Router();

router.post("/login", validate({ body: loginSchema }), login);
router.post("/refresh", validate({ body: refreshSchema }), refresh);
router.post("/logout", validate({ body: refreshSchema }), logout);
router.post("/forgot-password", validate({ body: forgotPasswordSchema }), forgotPassword);
router.post("/reset-password", validate({ body: resetPasswordSchema }), resetPassword);
router.get("/me", authenticate, getMe);

export default router;

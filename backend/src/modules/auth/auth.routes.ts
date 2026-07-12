import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth.validators";
import { forgotPassword, getMe, login, logout, refresh, resetPassword, signup } from "./auth.controller";

const router = Router();

router.post("/login", validate({ body: loginSchema }), login);
router.post("/signup", validate({ body: signupSchema }), signup);
router.post("/refresh", validate({ body: refreshSchema }), refresh);
router.post("/logout", validate({ body: refreshSchema }), logout);
router.post("/forgot-password", validate({ body: forgotPasswordSchema }), forgotPassword);
router.post("/reset-password", validate({ body: resetPasswordSchema }), resetPassword);
router.get("/me", authenticate, getMe);

export default router;

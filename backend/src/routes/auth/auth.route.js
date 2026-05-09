import { Router } from "express";
import {
  login, logout, verify,
  forgotPassword, resetPassword, changePassword,
} from "../../controllers/auth/auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requestValidator } from "../../middlewares/validate.middleware.js";
import {
  loginValidator, forgotPasswordValidator,
  resetPasswordValidator, changePasswordValidator,
} from "../../validator/auth/auth.validator.js";

const router = Router();

router.post("/login", loginValidator, requestValidator, login);
router.post("/forgot-password", forgotPasswordValidator, requestValidator, forgotPassword);
router.post("/reset-password", resetPasswordValidator, requestValidator, resetPassword);
router.post("/logout", authMiddleware, logout);
router.get("/verify", authMiddleware, verify);
router.patch("/change-password", authMiddleware, changePasswordValidator, requestValidator, changePassword);

export default router;

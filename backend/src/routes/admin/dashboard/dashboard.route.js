import { Router } from "express";
import { getDashboard } from "../../../controllers/admin/dashboard.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/", getDashboard);

export default router;

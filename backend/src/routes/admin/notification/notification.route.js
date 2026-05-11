import { Router } from "express";
import { getNotifications, getNotificationById, markAsRead, markAllAsRead, deleteNotification, deleteAllRead, downloadNotificationPdf } from "../../../controllers/notification/notification.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";
import { requestValidator } from "../../../middlewares/validate.middleware.js";
import { idParamValidator } from "../../../validator/admin/admin.validator.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/",                  getNotifications);
router.patch("/read-all",        markAllAsRead);
router.delete("/delete-all-read",deleteAllRead);
router.get("/:id",               idParamValidator, requestValidator, getNotificationById);
router.get("/:id/pdf",           idParamValidator, requestValidator, downloadNotificationPdf);
router.patch("/:id/read",        idParamValidator, requestValidator, markAsRead);
router.delete("/:id",            idParamValidator, requestValidator, deleteNotification);

export default router;

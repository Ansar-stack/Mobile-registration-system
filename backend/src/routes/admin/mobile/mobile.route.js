import { Router } from "express";
import { getAllMobiles, getMobileById, updateMobile, deleteMobile } from "../../../controllers/admin/mobile.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";
import { requestValidator } from "../../../middlewares/validate.middleware.js";
import { idParamValidator } from "../../../validator/admin/admin.validator.js";
import { updateMobileValidator } from "../../../validator/phone/mobile.validator.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/",       getAllMobiles);
router.get("/:id",    idParamValidator, requestValidator, getMobileById);
router.patch("/:id",  idParamValidator, updateMobileValidator, requestValidator, updateMobile);
router.delete("/:id", idParamValidator, requestValidator, deleteMobile);

export default router;

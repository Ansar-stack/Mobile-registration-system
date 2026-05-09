import { Router } from "express";
import { getStolenMobiles, getStolenMobileById, createStolenMobile, updateStolenMobile, deleteStolenMobile } from "../../../controllers/admin/stolenMobile.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";
import { requestValidator } from "../../../middlewares/validate.middleware.js";
import { createStolenMobileValidator, updateStolenMobileValidator, idParamValidator } from "../../../validator/phone/mobile.validator.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/stolen-mobiles", getStolenMobiles);
router.get("/stolen-mobiles/:id", idParamValidator, requestValidator, getStolenMobileById);
router.post("/stolen-mobiles", createStolenMobileValidator, requestValidator, createStolenMobile);
router.patch("/stolen-mobiles/:id", idParamValidator, updateStolenMobileValidator, requestValidator, updateStolenMobile);
router.delete("/stolen-mobiles/:id", idParamValidator, requestValidator, deleteStolenMobile);

export default router;

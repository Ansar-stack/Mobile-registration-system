import { Router } from "express";
import { 
  getDetectedStolenMobiles, 
  getDetectedStolenMobileById, 
  deleteDetectedStolenMobile,
  getDetectedStolenMobileStats 
} from "../../../controllers/admin/detectedStolenMobile.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";
import { requestValidator } from "../../../middlewares/validate.middleware.js";
import { idParamValidator } from "../../../validator/phone/mobile.validator.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/detected-stolen-mobiles", getDetectedStolenMobiles);
router.get("/detected-stolen-mobiles/stats", getDetectedStolenMobileStats);
router.get("/detected-stolen-mobiles/:id", idParamValidator, requestValidator, getDetectedStolenMobileById);
router.delete("/detected-stolen-mobiles/:id", idParamValidator, requestValidator, deleteDetectedStolenMobile);

export default router;
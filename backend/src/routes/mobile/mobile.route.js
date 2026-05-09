import { Router } from "express";
import { getMyMobiles, getMobileById, createMobile } from "../../controllers/mobile/mobile.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requestValidator } from "../../middlewares/validate.middleware.js";
import { createMobileValidator, idParamValidator } from "../../validator/phone/mobile.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/",      getMyMobiles);
router.get("/:id",   idParamValidator, requestValidator, getMobileById);
router.post("/",     createMobileValidator, requestValidator, createMobile);

export default router;

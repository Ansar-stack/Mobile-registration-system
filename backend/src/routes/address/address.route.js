import { Router } from "express";
import { getAddresses, addAddress } from "../../controllers/address/address.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requestValidator } from "../../middlewares/validate.middleware.js";
import { bothAddressesValidator } from "../../validator/address/address.validator.js";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/",  getAddresses);
router.post("/", bothAddressesValidator, requestValidator, addAddress);

export default router;

import { Router } from "express";
import { getAddresses, addAddress, updateAddress, deleteAddress } from "../../controllers/address/address.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requestValidator } from "../../middlewares/validate.middleware.js";
import { bothAddressesValidator } from "../../validator/address/address.validator.js";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

import { idParamValidator } from "../../validator/phone/mobile.validator.js";

router.get("/",       getAddresses);
router.post("/",      bothAddressesValidator, requestValidator, addAddress);
router.patch("/:id",  idParamValidator, requestValidator, updateAddress);
router.delete("/:id", idParamValidator, requestValidator, deleteAddress);

export default router;

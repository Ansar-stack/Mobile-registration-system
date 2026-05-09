import { Router } from "express";
import { getMyCustomers, getCustomerById, createCustomer, updateCustomer } from "../../controllers/customer/customer.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requestValidator } from "../../middlewares/validate.middleware.js";
import { createCustomerValidator, updateCustomerValidator } from "../../validator/customer/customer.validator.js";
import { idParamValidator } from "../../validator/phone/mobile.validator.js";
import { upload, processUploadedImage } from "../../configs/multer/multer.config.js";

const router = Router();

router.use(authMiddleware);

router.get("/",      getMyCustomers);
router.get("/:id",   idParamValidator, requestValidator, getCustomerById);
router.post("/",     upload.single("idImage"), processUploadedImage, createCustomerValidator, requestValidator, createCustomer);
router.patch("/:id", idParamValidator, upload.single("idImage"), processUploadedImage, updateCustomerValidator, requestValidator, updateCustomer);

export default router;

import { Router } from "express";
import { getAllCustomers, getCustomerById, updateCustomer, deleteCustomer } from "../../../controllers/admin/customer.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";
import { requestValidator } from "../../../middlewares/validate.middleware.js";
import { idParamValidator } from "../../../validator/admin/admin.validator.js";
import { updateCustomerValidator } from "../../../validator/customer/customer.validator.js";
import { upload, processUploadedImage } from "../../../configs/multer/multer.config.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/",       getAllCustomers);
router.get("/:id",    idParamValidator, requestValidator, getCustomerById);
router.patch("/:id",  idParamValidator, upload.single("idImage"), processUploadedImage, updateCustomerValidator, requestValidator, updateCustomer);
router.delete("/:id", idParamValidator, requestValidator, deleteCustomer);

export default router;

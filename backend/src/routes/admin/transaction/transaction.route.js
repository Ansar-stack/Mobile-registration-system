import { Router } from "express";
import { getAllTransactions, getTransactionById, deleteTransaction } from "../../../controllers/admin/transaction.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";
import { requestValidator } from "../../../middlewares/validate.middleware.js";
import { idParamValidator } from "../../../validator/admin/admin.validator.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/",      getAllTransactions);
router.get("/:id",   idParamValidator, requestValidator, getTransactionById);
router.delete("/:id",idParamValidator, requestValidator, deleteTransaction);

export default router;

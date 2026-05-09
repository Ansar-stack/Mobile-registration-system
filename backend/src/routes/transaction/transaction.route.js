import { Router } from "express";
import { createTransaction, getMyTransactions, getTransactionById } from "../../controllers/transaction/transaction.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requestValidator } from "../../middlewares/validate.middleware.js";
import { createTransactionValidator } from "../../validator/transaction/transaction.validator.js";
import { idParamValidator } from "../../validator/phone/mobile.validator.js";

const router = Router();

router.use(authMiddleware);

router.get("/",     getMyTransactions);
router.get("/:id",  idParamValidator, requestValidator, getTransactionById);
router.post("/",    createTransactionValidator, requestValidator, createTransaction);

export default router;

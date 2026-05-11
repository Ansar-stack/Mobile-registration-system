import { Router } from "express";
import { getUsers, getUserById, getUserMobiles, getUserCustomers, getUserTransactions, createUser, updateUser, deleteUser, toggleUserActive } from "../../../controllers/admin/user.controller.js";
import { authorizeRole } from "../../../middlewares/authorizeRole.middleware.js";
import { requestValidator } from "../../../middlewares/validate.middleware.js";
import { createUserValidator, updateUserValidator, idParamValidator } from "../../../validator/admin/admin.validator.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRole(["admin"]));

router.get("/users",                    getUsers);
router.get("/users/:id",                idParamValidator, requestValidator, getUserById);
router.get("/users/:id/mobiles",        idParamValidator, requestValidator, getUserMobiles);
router.get("/users/:id/customers",      idParamValidator, requestValidator, getUserCustomers);
router.get("/users/:id/transactions",   idParamValidator, requestValidator, getUserTransactions);
router.post("/users",                   createUserValidator, requestValidator, createUser);
router.patch("/users/:id",              idParamValidator, updateUserValidator, requestValidator, updateUser);
router.patch("/users/:id/toggle-active", idParamValidator, requestValidator, toggleUserActive);
router.delete("/users/:id",             idParamValidator, requestValidator, deleteUser);

export default router;

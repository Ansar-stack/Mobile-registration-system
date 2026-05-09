import { Router } from "express";
import authRoutes        from "./auth/auth.route.js";
import adminRoutes       from "./admin/admin.route.js";
import customerRoutes    from "./customer/customer.route.js";
import mobileRoutes      from "./mobile/mobile.route.js";
import transactionRoutes from "./transaction/transaction.route.js";
import addressRoutes     from "./address/address.route.js";

const router = Router();

router.use("/auth",                          authRoutes);
router.use("/admin",                         adminRoutes);
router.use("/customers",                     customerRoutes);
router.use("/customers/:customerId/addresses",addressRoutes);
router.use("/mobiles",                       mobileRoutes);
router.use("/transactions",                  transactionRoutes);

export default router;

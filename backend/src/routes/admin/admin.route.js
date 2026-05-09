import { Router } from "express";
import userRouter         from './user/user.route.js';
import stolenMobileRouter from './stolenMobile/stolenMobile.route.js';
import detectedStolenMobileRouter from './detectedStolenMobile/detectedStolenMobile.route.js';
import notificationRouter from './notification/notification.route.js';
import mobileRouter       from './mobile/mobile.route.js';
import customerRouter     from './customer/customer.route.js';
import transactionRouter  from './transaction/transaction.route.js';
import dashboardRouter    from './dashboard/dashboard.route.js';

const router = Router();

router.use("/dashboard",    dashboardRouter);
router.use("/user",         userRouter);
router.use("/stolen-mobile",stolenMobileRouter);
router.use("/detected-stolen-mobile", detectedStolenMobileRouter);
router.use("/notifications",notificationRouter);
router.use("/mobiles",      mobileRouter);
router.use("/customers",    customerRouter);
router.use("/transactions", transactionRouter);

export default router;
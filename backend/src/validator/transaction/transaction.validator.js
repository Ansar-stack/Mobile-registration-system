import { body } from "express-validator";

export const createTransactionValidator = [
  body("type").notEmpty().withMessage("validation.transactionTypeRequired").isIn(["BUY", "SELL", "UNLOCK"]).withMessage("validation.transactionTypeInvalid"),
  body("mobileId").notEmpty().withMessage("validation.mobileIdRequired").isInt({ min: 1 }).withMessage("validation.mobileIdInvalid"),
  body("customerId")
    .if((value, { req }) => ["BUY", "UNLOCK"].includes(req.body.type))
    .notEmpty().withMessage("validation.customerRequired")
    .isInt({ min: 1 }).withMessage("validation.customerIdInvalid")
    .bail()
    .if((value, { req }) => req.body.type === "SELL")
    .optional()
    .isInt({ min: 1 }).withMessage("validation.customerIdInvalid"),
  body("price").optional().isFloat({ min: 0 }).withMessage("validation.priceInvalid"),
  body("notes").optional().isString().isLength({ max: 500 }).withMessage("validation.notesMax").trim(),
];

export const updateTransactionValidator = [
  body("type").optional().isIn(["BUY", "SELL", "UNLOCK"]).withMessage("validation.transactionTypeInvalid"),
  body("customerId").optional().isInt({ min: 1 }).withMessage("validation.customerIdInvalid"),
  body("price").optional().isFloat({ min: 0 }).withMessage("validation.priceInvalid"),
  body("notes").optional().isString().isLength({ max: 500 }).withMessage("validation.notesMax").trim(),
];

import { body, param } from "express-validator";

export const idParamValidator = [
  param("id").isInt({ min: 1 }).withMessage("validation.idInvalid"),
];

export const createUserValidator = [
  body("name").optional().isString().withMessage("validation.nameString").isLength({ min: 2 }).withMessage("validation.nameMin"),
  body("email").notEmpty().withMessage("validation.emailRequired").isEmail().withMessage("validation.emailInvalid"),
  body("password").notEmpty().withMessage("validation.passwordRequired").isLength({ min: 8 }).withMessage("validation.passwordMin").trim(),
  body("phone").optional().matches(/^(?:\+93|0093|0)7[0-9]{8}$|^\+93[0-9]{9}$/).withMessage("validation.phoneInvalid"),
  body("shopNumber").optional().isString().withMessage("validation.shopNumberString"),
  body("idCardNumber").optional().isString().withMessage("validation.idCardNumberString"),
  body("address").optional().isString().withMessage("validation.addressString"),
  body("role").optional().isIn(["user", "admin"]).withMessage("validation.roleInvalid"),
];

export const updateUserValidator = [
  body("name").optional().isString().withMessage("validation.nameString").isLength({ min: 2 }).withMessage("validation.nameMin"),
  body("email").optional().isEmail().withMessage("validation.emailInvalid"),
  body("password").optional().isLength({ min: 8 }).withMessage("validation.passwordMin").trim(),
  body("phone").optional().matches(/^(?:\+93|0093|0)7[0-9]{8}$|^\+93[0-9]{9}$/).withMessage("validation.phoneInvalid"),
  body("shopNumber").optional().isString().withMessage("validation.shopNumberString"),
  body("idCardNumber").optional().isString().withMessage("validation.idCardNumberString"),
  body("address").optional().isString().withMessage("validation.addressString"),
  body("role").optional().isIn(["user", "admin"]).withMessage("validation.roleInvalid"),
];

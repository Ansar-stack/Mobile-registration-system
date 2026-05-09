import { body } from "express-validator";

// Afghan phone: 07xxxxxxxx (10 digits) or +9307xxxxxxxx / 9307xxxxxxxx (12-13 digits)
const afghanPhoneRegex = /^(?:\+93|0093|0)7[0-9]{8}$|^\+93[0-9]{9}$/;

export const createCustomerValidator = [
  body("firstName").notEmpty().withMessage("validation.firstNameRequired").isString().isLength({ min: 2 }).withMessage("validation.firstNameMin").trim(),
  body("lastName").notEmpty().withMessage("validation.lastNameRequired").isString().isLength({ min: 2 }).withMessage("validation.lastNameMin").trim(),
  body("gender").notEmpty().withMessage("validation.genderRequired").isIn(["male", "female", "other"]).withMessage("validation.genderInvalid"),
  body("idCardNumber").notEmpty().withMessage("validation.idCardRequired").isString().trim(),
  body("phoneNumber")
    .notEmpty().withMessage("validation.phoneNumberRequired")
    .matches(afghanPhoneRegex).withMessage("validation.phoneInvalid"),
];

export const updateCustomerValidator = [
  body("firstName").optional().isString().isLength({ min: 2 }).withMessage("validation.firstNameMin").trim(),
  body("lastName").optional().isString().isLength({ min: 2 }).withMessage("validation.lastNameMin").trim(),
  body("gender").optional().isIn(["male", "female", "other"]).withMessage("validation.genderInvalid"),
  body("idCardNumber").optional().isString().trim(),
  body("phoneNumber")
    .optional()
    .matches(afghanPhoneRegex).withMessage("validation.phoneInvalid"),
];

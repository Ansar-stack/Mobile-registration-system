import { body, param } from "express-validator";

const imeiRegex = /^\d{15}$/;
const afghanPhoneRegex = /^(?:\+93|0093|0)7[0-9]{8}$|^\+93[0-9]{9}$/;

export const idParamValidator = [
  param("id").isInt({ min: 1 }).withMessage("validation.idInvalid"),
];

const imeiField = (field, required = true) => {
  const isImei1 = field === "imei1";
  const chain = required
    ? body(field).notEmpty().withMessage(isImei1 ? "validation.imei1Required" : "validation.imei2Required")
    : body(field).optional({ checkFalsy: true });
  return chain
    .isNumeric().withMessage(isImei1 ? "validation.imei1Digits" : "validation.imei2Digits")
    .isLength({ min: 15, max: 15 }).withMessage(isImei1 ? "validation.imei1Length" : "validation.imei2Length")
    .matches(imeiRegex).withMessage(isImei1 ? "validation.imei1Length" : "validation.imei2Length")
    .trim();
};

export const createMobileValidator = [
  imeiField("imei1", true),
  imeiField("imei2", false),
  body("brand").notEmpty().withMessage("validation.brandRequired").isString().trim(),
  body("model").notEmpty().withMessage("validation.modelRequired").isString().trim(),
  body("color").notEmpty().withMessage("validation.colorRequired").isString().trim(),
  body("ram").optional().isString().trim(),
  body("storage").optional().isString().trim(),
  body("type").notEmpty().withMessage("validation.transactionTypeRequired").isIn(["BUY", "SELL", "UNLOCK"]).withMessage("validation.transactionTypeInvalid"),
  body("customerId").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("validation.customerIdInvalid"),
  body("price").optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage("validation.priceInvalid"),
  body("notes").optional().isString().isLength({ max: 500 }).trim(),
];

export const updateMobileValidator = [
  imeiField("imei1", false),
  imeiField("imei2", false),
  body("brand").optional().isString().trim(),
  body("model").optional().isString().trim(),
  body("color").optional().isString().trim(),
  body("ram").optional().isString().trim(),
  body("storage").optional().isString().trim(),
];

export const createStolenMobileValidator = [
  imeiField("imei1", true),
  imeiField("imei2", false),
  body("brand").notEmpty().withMessage("validation.brandRequired").isString().trim(),
  body("model").notEmpty().withMessage("validation.modelRequired").isString().trim(),
  body("color").optional().isString().trim(),
  body("ram").optional().isString().trim(),
  body("storage").optional().isString().trim(),
  body("reporterName").notEmpty().withMessage("validation.reporterNameRequired").isString().trim(),
  body("reporterPhone").notEmpty().withMessage("validation.reporterPhoneRequired").matches(afghanPhoneRegex).withMessage("validation.phoneInvalid").trim(),
];

export const updateStolenMobileValidator = [
  imeiField("imei1", false),
  imeiField("imei2", false),
  body("brand").optional().isString().trim(),
  body("model").optional().isString().trim(),
  body("color").optional().isString().trim(),
  body("ram").optional().isString().trim(),
  body("storage").optional().isString().trim(),
  body("reporterName").optional().isString().trim(),
  body("reporterPhone").optional().matches(afghanPhoneRegex).withMessage("validation.phoneInvalid").trim(),
];

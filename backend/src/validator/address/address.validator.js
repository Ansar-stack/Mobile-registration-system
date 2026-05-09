import { body } from "express-validator";

export const addressValidator = [];

const addressFields = (prefix) => [
  body(`${prefix}.type`).optional().isIn(["PERMANENT", "CURRENT"]).withMessage("validation.addressTypeInvalid"),
  body(`${prefix}.province`).optional().isString().trim(),
  body(`${prefix}.city`).optional().isString().trim(),
  body(`${prefix}.district`).optional().isString().trim(),
];

export const permanentAddressValidator = addressFields("permanentAddress");
export const currentAddressValidator   = addressFields("currentAddress");
export const bothAddressesValidator    = [...permanentAddressValidator, ...currentAddressValidator];

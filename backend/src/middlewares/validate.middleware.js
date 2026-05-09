import { validationResult } from 'express-validator';
import { t } from '../utils/i18n.util.js';

export const requestValidator = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const lang = (req.headers["accept-language"] || "en").split(",")[0].split("-")[0].trim();
        const rawMsg = errors.array()[0]?.msg || "validation.error";
        const message = t(lang, rawMsg);
        return res.respond(400, message);
    }
    next();
};

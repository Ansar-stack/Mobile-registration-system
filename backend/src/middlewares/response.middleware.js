
import { t } from "../utils/i18n.util.js";

export const responseMiddleware = (req, res, next) => {
    const lang = (req.headers["accept-language"] || "en").split(",")[0].split("-")[0].trim();
    req.t = (key) => t(lang, key);

    res.respond = function(status, message = "Success", data = null){
        const responseBody = {
            success: status >= 200 && status < 300, 
            message: message, 
            status: status
        };
        if(data && typeof data === "object"){
            Object.assign(responseBody, {data});
        }
        res.status(status).json(responseBody);
    }
    next();
}
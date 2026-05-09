import multer from "multer";
import logger from "../../logs/logger.js";

export const ErrorMiddlware = async (err, req, res, next) => {
  let message = err.message;

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      message = req.t("middleware.fileTooLarge");
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = req.t("middleware.onlyImages");
    }
    return res.respond(400, message);
  }

  const statusCode = err.statusCode || err.status || 500;
  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.stack || err.message}`);

  return res.respond(statusCode, message);
};

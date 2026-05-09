import multer from "multer";
import logger from "../../logs/logger.js";

export const ErrorMiddlware = async (err, req, res, next) => {
  let message = err.message || "Something went wrong";

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

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = "Something went wrong";
  }

  return res.respond(statusCode, message);
};

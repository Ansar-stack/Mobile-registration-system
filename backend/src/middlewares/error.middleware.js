import multer from "multer";
import logger from "../../logs/logger.js";

export const ErrorMiddlware = async (err, req, res, next) => {
  // Prevent header already sent errors
  if (res.headersSent) {
    return next(err);
  }

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
  
  // Log error with more context
  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.stack || err.message}`, {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = "Something went wrong";
  }

  // Ensure response is sent even if res.respond fails
  try {
    return res.respond(statusCode, message);
  } catch (responseError) {
    logger.error(`Error in response middleware: ${responseError.message}`);
    return res.status(statusCode).json({
      success: false,
      status: statusCode,
      message
    });
  }
};

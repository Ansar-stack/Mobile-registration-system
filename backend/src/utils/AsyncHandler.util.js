import ApiError from "./ApiError.util.js";
import logger from "../../logs/logger.js";

export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    // Prevent crashes by ensuring we always pass to error handler
    const status = error.status || error.statusCode || 500;
    logger.error(`[asyncHandler] ${req.method} ${req.originalUrl} - ${status} - ${error.message}`, {
      stack: error.stack,
      method: req.method,
      url: req.originalUrl
    });
    
    const message = status < 500 ? error.message : "Something went wrong";
    
    // Ensure we don't try to respond if headers already sent
    if (res.headersSent) {
      return next(error);
    }
    
    return next(new ApiError(status, message));
  }
};
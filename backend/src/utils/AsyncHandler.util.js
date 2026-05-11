import ApiError from "./ApiError.util.js";
import logger from "../../logs/logger.js";

export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    const status = error.status || error.statusCode || 500;
    logger.error(`[asyncHandler] ${error.message} ${error.stack || ''}`);
    const message = status < 500 ? error.message : "Something went wrong";
    return next(new ApiError(status, message));
  }
};
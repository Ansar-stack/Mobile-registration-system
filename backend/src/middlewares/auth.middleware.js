import { eq } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { verifyAccessToken, verifyAndRotateRefreshToken } from "../utils/verifyToken.util.js";

export const authMiddleware = async (req, res, next) => {
  // Try to get tokens from cookies first (for same-origin)
  let { accessToken, refreshToken } = req.cookies;
  
  // If not in cookies, try Authorization header (for cross-origin)
  if (!accessToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
  }
  
  // Get refresh token from header if not in cookies
  if (!refreshToken) {
    refreshToken = req.headers['x-refresh-token'];
  }
  
  console.log('Auth middleware - Tokens received:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    fromCookies: !!req.cookies.accessToken,
    fromHeaders: !!req.headers.authorization,
    origin: req.headers.origin
  });
  
  if (!accessToken || !refreshToken) {
    console.log('Auth failed: Missing tokens');
    return res.respond(401, req.t("middleware.unauthorized"));
  }

  const verifyToken = verifyAccessToken(accessToken);
  if (verifyToken.valid) {
    const [user] = await db.select().from(users).where(eq(users.id, verifyToken.decoded.id));
    if (!user) {
      console.log('Auth failed: User not found');
      return res.respond(401, req.t("middleware.unauthorized"));
    }
    req.user = user;
    console.log('Auth success: User', user.email);
    return next();
  }

  if (!verifyToken.valid && verifyToken.expired) {
    if (!refreshToken) return res.respond(401, req.t("middleware.unauthorized"));
    const refreshVerification = await verifyAndRotateRefreshToken(refreshToken);
    if (!refreshVerification.valid) {
      console.log('Auth failed: Invalid refresh token');
      return res.respond(401, req.t("middleware.unauthorized"));
    }
    req.user = refreshVerification.user;
    console.log('Auth success via refresh: User', refreshVerification.user.email);
    return next();
  }

  console.log('Auth failed: Token invalid');
  return res.respond(401, req.t("middleware.unauthorized"));
};

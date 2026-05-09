import { eq } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { verifyAccessToken, verifyAndRotateRefreshToken } from "../utils/verifyToken.util.js";

export const authMiddleware = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;
  
  console.log('Auth middleware - Cookies received:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
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

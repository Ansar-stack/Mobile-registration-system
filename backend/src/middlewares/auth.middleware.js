import { eq } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { verifyAccessToken, verifyAndRotateRefreshToken } from "../utils/verifyToken.util.js";

export const authMiddleware = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;
  if (!accessToken || !refreshToken) return res.respond(401, req.t("middleware.unauthorized"));

  const verifyToken = verifyAccessToken(accessToken);
  if (verifyToken.valid) {
    const [user] = await db.select().from(users).where(eq(users.id, verifyToken.decoded.id));
    if (!user) return res.respond(401, req.t("middleware.unauthorized"));
    req.user = user;
    return next();
  }

  if (!verifyToken.valid && verifyToken.expired) {
    if (!refreshToken) return res.respond(401, req.t("middleware.unauthorized"));
    const refreshVerification = await verifyAndRotateRefreshToken(refreshToken);
    if (!refreshVerification.valid) return res.respond(401, req.t("middleware.unauthorized"));
    req.user = refreshVerification.user;
    return next();
  }

  return res.respond(401, req.t("middleware.unauthorized"));
};

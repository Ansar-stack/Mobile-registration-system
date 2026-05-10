import { eq } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { verifyAccessToken, verifyAndRotateRefreshToken } from "../utils/verifyToken.util.js";
import { accessTokenGenerator } from "../utils/genToken.util.js";
import { sentCookie } from "../utils/sentCookie.util.js";

export const authMiddleware = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;
  console.log("Tokens", acceessToken, refreshToken);
  if (!accessToken || !refreshToken) {
    return res.respond(401, req.t("middleware.unauthorized"));
  }

  const verifyToken = verifyAccessToken(accessToken);
  if (verifyToken.valid) {
    const [user] = await db.select().from(users).where(eq(users.id, verifyToken.decoded.id));
    if (!user) return res.respond(401, req.t("middleware.unauthorized"));
    req.user = user;
    return next();
  }

  if (!verifyToken.valid && verifyToken.expired) {
    const refreshVerification = await verifyAndRotateRefreshToken(refreshToken);
    if (!refreshVerification.valid) return res.respond(401, req.t("middleware.unauthorized"));

    const newAccessToken = accessTokenGenerator({ id: refreshVerification.user.id });
    sentCookie("accessToken", res, newAccessToken);
    sentCookie("refreshToken", res, refreshVerification.newRefreshToken);

    req.user = refreshVerification.user;
    return next();
  }

  return res.respond(401, req.t("middleware.unauthorized"));
};

import { eq } from "drizzle-orm";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { verifyAccessToken } from "../utils/verifyToken.util.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!accessToken) return res.respond(401, req.t("middleware.unauthorized"));

  const verifyToken = verifyAccessToken(accessToken);
  if (!verifyToken.valid) return res.respond(401, req.t("middleware.unauthorized"));

  const [user] = await db.select().from(users).where(eq(users.id, verifyToken.decoded.id));
  if (!user) return res.respond(401, req.t("middleware.unauthorized"));

  req.user = user;
  return next();
};

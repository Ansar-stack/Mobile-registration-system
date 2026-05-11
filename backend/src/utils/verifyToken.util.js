import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import db from "../configs/db/db.config.js";
import { users } from "../db/schema.js";
import { refreshTokenGenerator } from "./genToken.util.js";

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return { valid: true, expired: false, decoded };
  } catch (error) {
    return { valid: false, expired: error.name === "TokenExpiredError", decoded: null };
  }
};

export const verifyAndRotateRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, phone: users.phone, shopNumber: users.shopNumber, refreshToken: users.refreshToken })
      .from(users)
      .where(eq(users.id, decoded.id));
    if (!user || user.refreshToken !== refreshToken) return { valid: false, user: null };

    const newRefreshToken = refreshTokenGenerator({ id: user.id });
    await db.update(users).set({ refreshToken: newRefreshToken }).where(eq(users.id, user.id));

    return { valid: true, user, newRefreshToken };
  } catch {
    return { valid: false, user: null };
  }
};

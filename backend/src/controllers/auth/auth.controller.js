import { eq } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import { accessTokenGenerator, refreshTokenGenerator } from "../../utils/genToken.util.js";
import { comparePassword, hashPassword } from "../../utils/hash.util.js";
import { sentCookie } from "../../utils/sentCookie.util.js";
import db from "../../configs/db/db.config.js";
import { users } from "../../db/schema.js";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../../services/Email/email.service.js";

// Register
export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return res.respond(400, req.t("auth.emailExists"));

  const hashed = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, password: hashed }).returning({ id: users.id, role: users.role });

  const refreshToken = refreshTokenGenerator({ id: user.id });
  await db.update(users).set({ refreshToken }).where(eq(users.id, user.id));

  const accessToken = accessTokenGenerator({ id: user.id });
  sentCookie("accessToken", res, accessToken);
  sentCookie("refreshToken", res, refreshToken);

  res.respond(201, req.t("auth.registered"), { id: user.id, role: user.role });
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for:', email);

  let user;
  try {
    [user] = await db.select().from(users).where(eq(users.email, email));
    console.log('User found:', user ? 'Yes' : 'No');
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }

  if (!user) return res.respond(400, req.t("auth.userNotFound"));

  const match = await comparePassword(password, user.password);
  if (!match) return res.respond(400, req.t("auth.incorrectPassword"));

  const refreshToken = refreshTokenGenerator({ id: user.id });
  await db.update(users).set({ refreshToken }).where(eq(users.id, user.id));

  const accessToken = accessTokenGenerator({ id: user.id });
  
  console.log('Setting cookies for user:', user.email);
  console.log('Access token length:', accessToken.length);
  console.log('Refresh token length:', refreshToken.length);
  
  // Set cookies (for same-origin requests)
  sentCookie("accessToken", res, accessToken);
  sentCookie("refreshToken", res, refreshToken);

  // Also send tokens in response body (for cross-origin requests)
  res.respond(200, req.t("auth.loggedIn"), { 
    id: user.id, 
    role: user.role,
    accessToken,
    refreshToken
  });
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  await db.update(users).set({ refreshToken: null }).where(eq(users.id, req.user.id));
  sentCookie("accessToken", res, "", { maxAge: 0 });
  sentCookie("refreshToken", res, "", { maxAge: 0 });
  res.respond(200, req.t("auth.loggedOut"));
});

// Verify (get current user)
export const verify = asyncHandler(async (req, res) => {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, shopNumber: users.shopNumber, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, req.user.id));
  if (!user) return res.respond(404, req.t("auth.userNotFoundById"));
  res.respond(200, req.t("auth.verified"), { user });
});

// Forgot Password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return res.respond(400, req.t("auth.emailNotFound"));

  const token = accessTokenGenerator({ id: user.id }, "15m");
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  await sendPasswordResetEmail(email, resetLink);
  res.respond(200, req.t("auth.resetLinkSent"));
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    return res.respond(400, req.t("auth.invalidResetToken"));
  }

  const hashed = await hashPassword(password);
  await db.update(users).set({ password: hashed }).where(eq(users.id, decoded.id));
  res.respond(200, req.t("auth.passwordReset"));
});

// Change Password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
  const match = await comparePassword(currentPassword, user.password);
  if (!match) return res.respond(400, req.t("auth.incorrectCurrentPassword"));

  const isSame = await comparePassword(newPassword, user.password);
  if (isSame) return res.respond(400, req.t("auth.passwordSame"));

  const hashed = await hashPassword(newPassword);
  await db.update(users).set({ password: hashed }).where(eq(users.id, user.id));
  res.respond(200, req.t("auth.passwordChanged"));
});

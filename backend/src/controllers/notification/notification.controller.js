import { eq, and, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { notifications, mobiles, users, transactions } from "../../db/schema.js";

const notifCols = {
  id: notifications.id, type: notifications.type, message: notifications.message,
  imei: notifications.imei, isRead: notifications.isRead,
  mobileId: notifications.mobileId, userId: notifications.userId,
  createdAt: notifications.createdAt,
};

const enrichNotification = async (notif) => {
  if (!notif) return notif;
  const [mobile, user] = await Promise.all([
    notif.mobileId
      ? db.query.mobiles.findFirst({
          where: (m, { eq: eqFn }) => eqFn(m.id, notif.mobileId),
          with: { transactions: { orderBy: (tx, { desc }) => [desc(tx.createdAt)], with: { user: { columns: { id: true, name: true, email: true, shopNumber: true } }, customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true } } } } },
        })
      : Promise.resolve(null),
    notif.userId
      ? db.select({ id: users.id, name: users.name, email: users.email, shopNumber: users.shopNumber, phone: users.phone }).from(users).where(eq(users.id, notif.userId)).then(([r]) => r ?? null)
      : Promise.resolve(null),
  ]);
  return { ...notif, mobile, registeredBy: user };
};

// GET /admin/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  const filters = [];
  if (req.query.type)   filters.push(eq(notifications.type, req.query.type));
  if (req.query.isRead !== undefined) filters.push(eq(notifications.isRead, req.query.isRead === "true"));
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }], [{ unreadCount }]] = await Promise.all([
    db.select(notifCols).from(notifications).where(where).orderBy(sql`${notifications.createdAt} desc`).limit(limit).offset(offset),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(notifications).where(where),
    db.select({ unreadCount: sql`count(*)`.mapWith(Number) }).from(notifications).where(eq(notifications.isRead, false)),
  ]);

  const enriched = await Promise.all(rows.map(enrichNotification));
  res.respond(200, req.t("notification.fetched"), { notifications: enriched, unreadCount, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/notifications/:id
export const getNotificationById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [notification] = await db.select(notifCols).from(notifications).where(eq(notifications.id, id));
  if (!notification) return res.respond(404, req.t("notification.notFound"));
  const enriched = await enrichNotification(notification);
  res.respond(200, req.t("notification.fetchedOne"), { notification: enriched });
});

// PATCH /admin/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.id, id));
  if (!existing) return res.respond(404, req.t("notification.notFound"));
  const [notification] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning(notifCols);
  res.respond(200, req.t("notification.markedRead"), { notification });
});

// PATCH /admin/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  res.respond(200, req.t("notification.allMarkedRead"));
});

// DELETE /admin/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.id, id));
  if (!existing) return res.respond(404, req.t("notification.notFound"));
  await db.delete(notifications).where(eq(notifications.id, id));
  res.respond(200, req.t("notification.deleted"));
});

// DELETE /admin/notifications/delete-all-read
export const deleteAllRead = asyncHandler(async (req, res) => {
  await db.delete(notifications).where(eq(notifications.isRead, true));
  res.respond(200, req.t("notification.allReadDeleted"));
});

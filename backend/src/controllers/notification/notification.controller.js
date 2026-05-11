import { eq, and, sql, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { notifications, mobiles, users, transactions, customers, addresses } from "../../db/schema.js";
import PDFDocument from "pdfkit";
import axios from "axios";

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

  // Batch fetch mobiles and users instead of N+1 queries
  const mobileIds = [...new Set(rows.map(r => r.mobileId).filter(Boolean))];
  const userIds   = [...new Set(rows.map(r => r.userId).filter(Boolean))];

  const [mobileRows, userRows] = await Promise.all([
    mobileIds.length
      ? db.query.mobiles.findMany({
          where: (m, { inArray: inFn }) => inFn(m.id, mobileIds),
          with: { transactions: { orderBy: (tx, { desc }) => [desc(tx.createdAt)], with: { user: { columns: { id: true, name: true, email: true, shopNumber: true } }, customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true } } } } },
        })
      : Promise.resolve([]),
    userIds.length
      ? db.select({ id: users.id, name: users.name, email: users.email, shopNumber: users.shopNumber, phone: users.phone }).from(users).where(inArray(users.id, userIds))
      : Promise.resolve([]),
  ]);

  const mobileMap = Object.fromEntries(mobileRows.map(m => [m.id, m]));
  const userMap   = Object.fromEntries(userRows.map(u => [u.id, u]));

  const enriched = rows.map(n => ({
    ...n,
    mobile:       n.mobileId ? (mobileMap[n.mobileId] ?? null) : null,
    registeredBy: n.userId   ? (userMap[n.userId]     ?? null) : null,
  }));

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

// GET /admin/notifications/:id/pdf
export const downloadNotificationPdf = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [notif] = await db.select().from(notifications).where(eq(notifications.id, id));
  if (!notif) return res.respond(404, req.t("notification.notFound"));

  // Fetch full mobile with all transactions, customer, addresses, user
  const mobile = notif.mobileId ? await db.query.mobiles.findFirst({
    where: (m, { eq: eqFn }) => eqFn(m.id, notif.mobileId),
    with: {
      transactions: {
        orderBy: (tx, { desc }) => [desc(tx.createdAt)],
        with: {
          user: { columns: { id: true, name: true, email: true, phone: true, shopNumber: true } },
          customer: { with: { addresses: true } },
        },
      },
    },
  }) : null;

  // Use the transaction linked to the notification's userId for context, fallback to latest
  const tx = mobile?.transactions?.find(t => t.userId === notif.userId)
    ?? mobile?.transactions?.[0]
    ?? null;
  const customer    = tx?.customer    ?? null;
  const registeredBy = tx?.user       ?? null;

  // Download ID image if exists
  let idImageBuffer = null;
  if (customer?.idImage) {
    try {
      const imgRes = await axios.get(customer.idImage, { responseType: "arraybuffer", timeout: 8000 });
      idImageBuffer = Buffer.from(imgRes.data);
    } catch { /* skip image if download fails */ }
  }

  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="mobile-registration-${notif.id}.pdf"`);

  doc.on("error", (err) => {
    if (!res.headersSent) {
      res.respond(500, "Failed to generate PDF");
    } else {
      res.end();
    }
  });

  doc.pipe(res);

  const W           = doc.page.width - 100;
  const LEFT        = 50;
  const primaryColor = "#1a56db";
  const lightGray    = "#f3f4f6";
  const darkText     = "#111827";
  const mutedText    = "#6b7280";

  // ── Header ──
  doc.rect(0, 0, doc.page.width, 90).fill(primaryColor);
  doc.fillColor("white").fontSize(20).font("Helvetica-Bold")
     .text("Kandahar Mobile Registration System", LEFT, 22, { width: doc.page.width - 100, align: "center" });
  const headerSubtitle = notif.type === "MOBILE_REGISTERED"
    ? `Mobile Registration Certificate — ${tx?.type === "UNLOCK" ? "Screen Unlock" : tx?.type === "BUY" ? "Buy" : tx?.type === "SELL" ? "Sell" : "Transaction"}`
    : notif.type === "STOLEN_MATCH" ? "Stolen Mobile Match Alert"
    : notif.type === "DUPLICATE_IMEI" ? "Duplicate IMEI Alert"
    : "Notification Report";
  doc.fillColor("white").fontSize(10).font("Helvetica")
     .text(headerSubtitle, LEFT, 50, { width: doc.page.width - 100, align: "center" });

  doc.y = 105;

  // ── Date ──
  doc.fillColor(mutedText).fontSize(9).font("Helvetica")
     .text(`Generated: ${new Date().toLocaleString()}`, LEFT, doc.y, { width: W, align: "right" });
  doc.moveDown(0.8);

  // ── Alert Banner (for STOLEN_MATCH / DUPLICATE_IMEI) ──
  if (notif.type === "STOLEN_MATCH" || notif.type === "DUPLICATE_IMEI") {
    const alertColor = notif.type === "STOLEN_MATCH" ? "#dc2626" : "#d97706";
    const alertBg    = notif.type === "STOLEN_MATCH" ? "#fef2f2" : "#fffbeb";
    const alertLabel = notif.type === "STOLEN_MATCH" ? "STOLEN MOBILE MATCH" : "DUPLICATE IMEI DETECTED";
    const ay = doc.y;
    doc.rect(LEFT, ay, W, 28).fill(alertBg);
    doc.rect(LEFT, ay, 4, 28).fill(alertColor);
    doc.fillColor(alertColor).fontSize(10).font("Helvetica-Bold")
       .text(`⚠  ${alertLabel}`, LEFT + 12, ay + 9, { width: W - 20 });
    doc.y = ay + 34;
    doc.moveDown(0.3);
  }

  const sectionTitle = (title) => {
    doc.moveDown(0.5);
    const sy = doc.y;
    doc.rect(LEFT, sy, W, 22).fill(primaryColor);
    doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
       .text(title, LEFT + 8, sy + 6, { width: W - 16 });
    doc.y = sy + 26;
  };

  let rowToggle = false;
  const row = (label, value) => {
    if (!value && value !== 0) return;
    const ry = doc.y;
    const bg = rowToggle ? "#ffffff" : lightGray;
    rowToggle = !rowToggle;
    doc.rect(LEFT, ry, W, 20).fill(bg);
    doc.fillColor(mutedText).fontSize(9).font("Helvetica-Bold")
       .text(label, LEFT + 8, ry + 6, { width: 140, lineBreak: false });
    doc.fillColor(darkText).fontSize(9).font("Helvetica")
       .text(String(value), LEFT + 155, ry + 6, { width: W - 163, lineBreak: false });
    doc.y = ry + 22;
  };

  // ── Mobile Info ──
  if (mobile) {
    rowToggle = false;
    sectionTitle("Mobile Device Information");
    row("IMEI 1",        mobile.imei1);
    row("IMEI 2",        mobile.imei2);
    row("Brand",         mobile.brand);
    row("Model",         mobile.model);
    row("Color",         mobile.color);
    row("RAM",           mobile.ram     ? `${mobile.ram} GB`     : null);
    row("Storage",       mobile.storage ? `${mobile.storage} GB` : null);
    row("Registered At", mobile.createdAt ? new Date(mobile.createdAt).toLocaleString() : null);
  }

  // ── Transaction Info ──
  if (tx) {
    rowToggle = false;
    sectionTitle("Transaction Details");
    row("Type",  tx.type === "UNLOCK" ? "Screen Unlock" : tx.type === "BUY" ? "Buy" : "Sell");
    row("Price", tx.price != null ? `$${tx.price}` : null);
    row("Notes", tx.notes);
    row("Date",  tx.createdAt ? new Date(tx.createdAt).toLocaleString() : null);
  }

  // ── Registered By ──
  if (registeredBy) {
    rowToggle = false;
    sectionTitle("Registered By (User)");
    row("Name",     registeredBy.name);
    row("Email",    registeredBy.email);
    row("Phone",    registeredBy.phone);
    row("Shop No.", registeredBy.shopNumber);
  }

  // ── Customer Info ──
  if (customer) {
    rowToggle = false;
    sectionTitle("Customer Information");
    row("First Name",  customer.firstName);
    row("Last Name",   customer.lastName);
    row("Gender",      customer.gender);
    row("Phone",       customer.phoneNumber);
    row("ID Card No.", customer.idCardNumber);
    if (customer.addresses?.length) {
      customer.addresses.forEach((addr) => {
        const addrVal = [addr.province, addr.city, addr.district].filter(Boolean).join(", ");
        if (addrVal) row(`${addr.type} Address`, addrVal);
      });
    }
  } else if (tx) {
    // No customer linked — still show a section so admin knows
    rowToggle = false;
    sectionTitle("Customer Information");
    row("Customer", "No customer linked to this transaction");
  }

  // ── ID Card Image ──
  if (idImageBuffer) {
    sectionTitle("Customer ID Card Image");
    doc.moveDown(0.3);
    const imgW = Math.min(W, 320);
    const imgX = LEFT + (W - imgW) / 2;
    try {
      doc.image(idImageBuffer, imgX, doc.y, { width: imgW, fit: [imgW, 220] });
      doc.moveDown(16);
    } catch { /* skip unsupported format */ }
  }

  // ── Footer ──
  doc.moveDown(2);
  const fy = doc.y;
  doc.rect(LEFT, fy, W, 1).fill("#e5e7eb");
  doc.moveDown(0.5);
  doc.fillColor(mutedText).fontSize(8).font("Helvetica")
     .text("Kandahar Mobile Registration System — Confidential Document", LEFT, doc.y, { width: W, align: "center" });

  doc.end();
});

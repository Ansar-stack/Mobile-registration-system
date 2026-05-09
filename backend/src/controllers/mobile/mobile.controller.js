import { eq, or, like, and, sql, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { mobiles, transactions, stolenMobiles, notifications, customers, users } from "../../db/schema.js";

const triggerNotifications = async (imei1, imei2, newMobileId, userId) => {
  const imeiOr = [eq(stolenMobiles.imei1, imei1), ...(imei2 ? [eq(stolenMobiles.imei2, imei2), eq(stolenMobiles.imei1, imei2)] : [])];
  const dupeOr = [
    eq(mobiles.imei1, imei1),
    ...(imei2 ? [eq(mobiles.imei2, imei2), eq(mobiles.imei1, imei2)] : []),
  ].filter(Boolean);

  const [[stolenMatch], dupeRows] = await Promise.all([
    db.select({ imei1: stolenMobiles.imei1 }).from(stolenMobiles).where(or(...imeiOr)).limit(1),
    db.select({ id: mobiles.id }).from(mobiles).where(and(or(...dupeOr), sql`${mobiles.id} != ${newMobileId}`)),
  ]);

  const inserts = [];
  if (stolenMatch) inserts.push({ type: "STOLEN_MATCH", imei: imei1, mobileId: newMobileId, userId, message: `Registered mobile IMEI ${imei1} matches a stolen mobile entry` });
  if (dupeRows.length) inserts.push({ type: "DUPLICATE_IMEI", imei: imei1, mobileId: newMobileId, userId, message: `Duplicate IMEI detected: ${imei1} was registered again — ${dupeRows.length + 1} entries now exist` });
  if (inserts.length) await db.insert(notifications).values(inserts);
};

// GET /mobiles
export const getMyMobiles = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { q, brand, model, color } = req.query;

  const filters = [];
  if (brand) filters.push(like(mobiles.brand, `%${brand.trim()}%`));
  if (model) filters.push(like(mobiles.model, `%${model.trim()}%`));
  if (color) filters.push(like(mobiles.color, `%${color.trim()}%`));
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(like(mobiles.imei1, t), like(mobiles.imei2, t), like(mobiles.brand, t), like(mobiles.model, t), like(mobiles.color, t)));
  }

  const mobileFilter = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.selectDistinct({
      id: mobiles.id, imei1: mobiles.imei1, imei2: mobiles.imei2,
      brand: mobiles.brand, model: mobiles.model, color: mobiles.color,
      ram: mobiles.ram, storage: mobiles.storage,
      createdAt: mobiles.createdAt, updatedAt: mobiles.updatedAt,
    })
    .from(mobiles)
    .innerJoin(transactions, eq(transactions.mobileId, mobiles.id))
    .where(and(eq(transactions.userId, req.user.id), mobileFilter))
    .orderBy(sql`${mobiles.createdAt} desc`)
    .limit(limit).offset(offset),

    db.select({ total: sql`count(distinct ${mobiles.id})`.mapWith(Number) })
    .from(mobiles)
    .innerJoin(transactions, eq(transactions.mobileId, mobiles.id))
    .where(and(eq(transactions.userId, req.user.id), mobileFilter)),
  ]);

  const mobileIds = rows.map((m) => m.id);
  const txRows = mobileIds.length
    ? await db.query.transactions.findMany({
        where: (tx, { and: andFn, eq: eqFn, inArray: inFn }) => andFn(eqFn(tx.userId, req.user.id), inFn(tx.mobileId, mobileIds)),
        orderBy: (tx, { desc }) => [desc(tx.createdAt)],
        with: {
          user:     { columns: { id: true, name: true, email: true } },
          customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true } },
        },
      })
    : [];

  const txByMobile = txRows.reduce((acc, tx) => {
    (acc[tx.mobileId] ??= []).push(tx);
    return acc;
  }, {});

  const result = rows.map((m) => ({ ...m, transactions: txByMobile[m.id] ?? [] }));
  res.respond(200, req.t("mobile.fetched"), { mobiles: result, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /mobiles/:id
export const getMobileById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const mobile = await db.query.mobiles.findFirst({
    where: (m, { eq: eqFn }) => eqFn(m.id, id),
    with: {
      transactions: {
        orderBy: (tx, { desc }) => [desc(tx.createdAt)],
        with: {
          user:     { columns: { id: true, name: true, email: true } },
          customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true } },
        },
      },
    },
  });
  if (!mobile) return res.respond(404, req.t("mobile.notFound"));

  const belongsToUser = mobile.transactions.some((t) => t.user?.id === req.user.id);
  if (!belongsToUser) return res.respond(403, req.t("customer.forbidden"));

  res.respond(200, req.t("mobile.fetchedOne"), { mobile });
});

// POST /mobiles
export const createMobile = asyncHandler(async (req, res) => {
  const { imei1, imei2, brand, model, color, ram, storage, type, customerId, price, notes } = req.body;

  const resolvedCustomerId = customerId ? parseInt(customerId) : null;

  if ((type === "BUY" || type === "UNLOCK") && !resolvedCustomerId)
    return res.respond(400, req.t("mobile.customerRequired"));

  const [customerCheck] = await Promise.all([
    resolvedCustomerId
      ? db.select({ id: customers.id }).from(customers).where(eq(customers.id, resolvedCustomerId)).limit(1)
      : Promise.resolve([{ id: true }]),
  ]);

  if (resolvedCustomerId && !customerCheck.length) return res.respond(404, req.t("mobile.customerNotFound"));

  const [mobile] = await db.insert(mobiles).values({ imei1, imei2, brand, model, color, ram, storage }).returning({ id: mobiles.id });
  await db.insert(transactions).values({ type, price: price || null, notes: notes || null, customerId: resolvedCustomerId, mobileId: mobile.id, userId: req.user.id });

  triggerNotifications(imei1, imei2, mobile.id, req.user.id).catch(() => {});

  const result = await db.query.mobiles.findFirst({
    where: (m, { eq: eqFn }) => eqFn(m.id, mobile.id),
    with: {
      transactions: {
        with: {
          user:     { columns: { id: true, name: true, email: true } },
          customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true } },
        },
      },
    },
  });

  res.respond(201, req.t("mobile.created"), { mobile: result });
});

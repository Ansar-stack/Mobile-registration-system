import { eq, or, like, and, sql, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { mobiles, transactions } from "../../db/schema.js";

const txWith = {
  user:     { columns: { id: true, name: true, email: true, shopNumber: true } },
  customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true, idCardNumber: true } },
};

// GET /admin/mobiles
export const getAllMobiles = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { q, brand, model, color, type, userId } = req.query;

  let mobileIds = null;
  if (type || userId) {
    const txFilters = [];
    if (type)   txFilters.push(eq(transactions.type, type));
    if (userId) txFilters.push(eq(transactions.userId, parseInt(userId)));
    const txRows = await db.select({ mobileId: transactions.mobileId }).from(transactions).where(and(...txFilters));
    mobileIds = [...new Set(txRows.map((r) => r.mobileId))];
    if (!mobileIds.length) return res.respond(200, req.t("mobile.fetched"), { mobiles: [], pagination: { total: 0, page, limit, totalPages: 0 } });
  }

  const filters = [];
  if (mobileIds) filters.push(inArray(mobiles.id, mobileIds));
  if (brand) filters.push(like(mobiles.brand, `%${brand.trim()}%`));
  if (model) filters.push(like(mobiles.model, `%${model.trim()}%`));
  if (color) filters.push(like(mobiles.color, `%${color.trim()}%`));
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(like(mobiles.imei1, t), like(mobiles.imei2, t), like(mobiles.brand, t), like(mobiles.model, t), like(mobiles.color, t)));
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.mobiles.findMany({
      where,
      limit,
      offset,
      orderBy: (m, { desc }) => [desc(m.createdAt)],
      with: { transactions: { orderBy: (tx, { desc }) => [desc(tx.createdAt)], with: txWith } },
    }),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(mobiles).where(where),
  ]);

  res.respond(200, req.t("mobile.fetched"), { mobiles: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/mobiles/:id
export const getMobileById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const mobile = await db.query.mobiles.findFirst({
    where: (m, { eq: eqFn }) => eqFn(m.id, id),
    with: { transactions: { orderBy: (tx, { desc }) => [desc(tx.createdAt)], with: txWith } },
  });
  if (!mobile) return res.respond(404, req.t("mobile.notFound"));
  res.respond(200, req.t("mobile.fetchedOne"), { mobile });
});

// PATCH /admin/mobiles/:id
export const updateMobile = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: mobiles.id }).from(mobiles).where(eq(mobiles.id, id));
  if (!existing) return res.respond(404, req.t("mobile.notFound"));

  const { brand, model, color, ram, storage } = req.body;
  const data = {};
  if (brand)   data.brand   = brand;
  if (model)   data.model   = model;
  if (color)   data.color   = color;
  if (ram)     data.ram     = ram;
  if (storage) data.storage = storage;

  if (!Object.keys(data).length) return res.respond(400, req.t("mobile.noFields"));
  data.updatedAt = new Date().toISOString();

  await db.update(mobiles).set(data).where(eq(mobiles.id, id));
  const mobile = await db.query.mobiles.findFirst({
    where: (m, { eq: eqFn }) => eqFn(m.id, id),
    with: { transactions: { orderBy: (tx, { desc }) => [desc(tx.createdAt)], with: txWith } },
  });
  res.respond(200, req.t("mobile.updated"), { mobile });
});

// DELETE /admin/mobiles/:id
export const deleteMobile = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: mobiles.id }).from(mobiles).where(eq(mobiles.id, id));
  if (!existing) return res.respond(404, req.t("mobile.notFound"));
  await db.delete(mobiles).where(eq(mobiles.id, id));
  res.respond(200, req.t("mobile.deleted"));
});

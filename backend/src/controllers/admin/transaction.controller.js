import { eq, and, sql, inArray, or, like } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { transactions, mobiles } from "../../db/schema.js";

const txWith = {
  user:     { columns: { id: true, name: true, email: true, shopNumber: true } },
  mobile:   { columns: { id: true, imei1: true, imei2: true, brand: true, model: true, color: true } },
  customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true, idCardNumber: true } },
};

// GET /admin/transactions
export const getAllTransactions = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { type, userId, mobileId, imei } = req.query;

  let resolvedMobileIds = null;
  if (imei) {
    const trimmed = imei.trim();
    const matched = await db
      .select({ id: mobiles.id })
      .from(mobiles)
      .where(or(like(mobiles.imei1, `%${trimmed}%`), like(mobiles.imei2, `%${trimmed}%`)));
    resolvedMobileIds = matched.map((m) => m.id);
    if (!resolvedMobileIds.length)
      return res.respond(200, req.t("transaction.fetched"), { transactions: [], pagination: { total: 0, page, limit, totalPages: 0 } });
  }

  const filters = [];
  if (type)              filters.push(eq(transactions.type,     type));
  if (userId)            filters.push(eq(transactions.userId,   parseInt(userId)));
  if (mobileId)          filters.push(eq(transactions.mobileId, parseInt(mobileId)));
  if (resolvedMobileIds) filters.push(inArray(transactions.mobileId, resolvedMobileIds));
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.transactions.findMany({ where, limit, offset, orderBy: (tx, { desc }) => [desc(tx.createdAt)], with: txWith }),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(transactions).where(where),
  ]);

  res.respond(200, req.t("transaction.fetched"), { transactions: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/transactions/:id
export const getTransactionById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const transaction = await db.query.transactions.findFirst({ where: (tx, { eq: eqFn }) => eqFn(tx.id, id), with: txWith });
  if (!transaction) return res.respond(404, req.t("transaction.notFound"));
  res.respond(200, req.t("transaction.fetchedOne"), { transaction });
});

// DELETE /admin/transactions/:id
export const deleteTransaction = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: transactions.id }).from(transactions).where(eq(transactions.id, id));
  if (!existing) return res.respond(404, req.t("transaction.notFound"));
  await db.delete(transactions).where(eq(transactions.id, id));
  res.respond(200, req.t("transaction.deleted"));
});

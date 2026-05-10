import { eq, and, or, like, sql, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { transactions, mobiles, customers } from "../../db/schema.js";

const txWith = {
  user:     { columns: { id: true, name: true, email: true } },
  mobile:   { columns: { id: true, imei1: true, imei2: true, brand: true, model: true, color: true } },
  customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true, idCardNumber: true } },
};

// POST /transactions
export const createTransaction = asyncHandler(async (req, res) => {
  const { mobileId, type, customerId, price, notes } = req.body;

  const [mobile] = await db.select({ id: mobiles.id }).from(mobiles).where(eq(mobiles.id, mobileId));
  if (!mobile) return res.respond(404, req.t("transaction.mobileNotFound"));

  if ((type === "BUY" || type === "UNLOCK") && !customerId)
    return res.respond(400, req.t("transaction.customerRequired"));

  if (customerId) {
    const [c] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, customerId));
    if (!c) return res.respond(404, req.t("transaction.customerNotFound"));
  }

  const [tx] = await db.insert(transactions).values({ type, price, notes, customerId: customerId || null, mobileId, userId: req.user.id }).returning({ id: transactions.id });
  const transaction = await db.query.transactions.findFirst({ where: (t, { eq: eqFn }) => eqFn(t.id, tx.id), with: txWith });
  res.respond(201, req.t("transaction.created"), { transaction });
});

// GET /transactions
export const getMyTransactions = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  const filters = [eq(transactions.userId, req.user.id)];
  if (req.query.type) filters.push(eq(transactions.type, req.query.type));

  // IMEI / mobile search via q param
  if (req.query.q) {
    const term = `%${req.query.q.trim()}%`;
    const matchingMobiles = await db
      .select({ id: mobiles.id })
      .from(mobiles)
      .where(or(like(mobiles.imei1, term), like(mobiles.imei2, term), like(mobiles.brand, term), like(mobiles.model, term)));
    const ids = matchingMobiles.map((m) => m.id);
    if (!ids.length) return res.respond(200, req.t("transaction.fetched"), { transactions: [], pagination: { total: 0, page, limit, totalPages: 0 } });
    filters.push(inArray(transactions.mobileId, ids));
  }

  const where = and(...filters);

  const [rows, [{ total }]] = await Promise.all([
    db.query.transactions.findMany({ where, limit, offset, orderBy: (tx, { desc }) => [desc(tx.createdAt)], with: txWith }),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(transactions).where(where),
  ]);

  res.respond(200, req.t("transaction.fetched"), { transactions: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /transactions/:id
export const getTransactionById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const transaction = await db.query.transactions.findFirst({ where: (tx, { eq: eqFn }) => eqFn(tx.id, id), with: txWith });
  if (!transaction)                          return res.respond(404, req.t("transaction.notFound"));
  if (transaction.user?.id !== req.user.id)  return res.respond(403, req.t("transaction.forbidden"));
  res.respond(200, req.t("transaction.fetchedOne"), { transaction });
});

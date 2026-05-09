import { eq, or, like, and, sql, inArray } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import { hashPassword } from "../../utils/hash.util.js";
import db from "../../configs/db/db.config.js";
import { users, transactions, customers, mobiles } from "../../db/schema.js";

const userCols = {
  id: users.id, name: users.name, email: users.email, phone: users.phone,
  shopNumber: users.shopNumber, role: users.role, createdAt: users.createdAt, updatedAt: users.updatedAt,
};

// GET /admin/users
export const getUsers = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { role, q, email, phone, shopNumber } = req.query;

  const filters = [];
  if (role)       filters.push(eq(users.role, role));
  if (email)      filters.push(like(users.email,      `%${email.trim()}%`));
  if (phone)      filters.push(like(users.phone,      `%${phone.trim()}%`));
  if (shopNumber) filters.push(like(users.shopNumber, `%${shopNumber.trim()}%`));
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(like(users.name, t), like(users.email, t), like(users.phone, t), like(users.shopNumber, t)));
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select(userCols).from(users).where(where).orderBy(sql`${users.createdAt} desc`).limit(limit).offset(offset),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(users).where(where),
  ]);

  res.respond(200, req.t("user.fetched"), { users: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const [[user], [{ txCount }], [{ custCount }]] = await Promise.all([
    db.select(userCols).from(users).where(eq(users.id, id)),
    db.select({ txCount:   sql`count(*)`.mapWith(Number) }).from(transactions).where(eq(transactions.userId, id)),
    db.select({ custCount: sql`count(*)`.mapWith(Number) }).from(customers).where(eq(customers.addedBy, id)),
  ]);

  if (!user) return res.respond(404, req.t("user.notFound"));
  res.respond(200, req.t("user.fetchedOne"), { user: { ...user, _count: { transactions: txCount, customers: custCount } } });
});

// GET /admin/users/:id/mobiles
export const getUserMobiles = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { q, brand, model, color, type } = req.query;

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!userRow) return res.respond(404, req.t("user.notFound"));

  const mFilters = [];
  if (brand) mFilters.push(like(mobiles.brand, `%${brand.trim()}%`));
  if (model) mFilters.push(like(mobiles.model, `%${model.trim()}%`));
  if (color) mFilters.push(like(mobiles.color, `%${color.trim()}%`));
  if (q) {
    const t = `%${q.trim()}%`;
    mFilters.push(or(like(mobiles.imei1, t), like(mobiles.imei2, t), like(mobiles.brand, t), like(mobiles.model, t)));
  }

  const txFilters = [eq(transactions.userId, userId)];
  if (type) txFilters.push(eq(transactions.type, type));
  const joinWhere = and(...txFilters, ...(mFilters.length ? mFilters : []));

  const [rows, [{ total }]] = await Promise.all([
    db.selectDistinct({
      id: mobiles.id, imei1: mobiles.imei1, imei2: mobiles.imei2,
      brand: mobiles.brand, model: mobiles.model, color: mobiles.color,
      ram: mobiles.ram, storage: mobiles.storage, createdAt: mobiles.createdAt,
    })
    .from(mobiles)
    .innerJoin(transactions, eq(transactions.mobileId, mobiles.id))
    .where(joinWhere)
    .orderBy(sql`${mobiles.createdAt} desc`)
    .limit(limit).offset(offset),

    db.select({ total: sql`count(distinct ${mobiles.id})`.mapWith(Number) })
    .from(mobiles)
    .innerJoin(transactions, eq(transactions.mobileId, mobiles.id))
    .where(joinWhere),
  ]);

  if (!rows.length) return res.respond(200, req.t("user.mobilesFetched"), { mobiles: [], pagination: { total: 0, page, limit, totalPages: 0 } });

  const mobileIds = rows.map((m) => m.id);
  const txWhere   = and(eq(transactions.userId, userId), inArray(transactions.mobileId, mobileIds));
  const txRows    = await db
    .select({ id: transactions.id, type: transactions.type, price: transactions.price, createdAt: transactions.createdAt, mobileId: transactions.mobileId, customerId: transactions.customerId })
    .from(transactions).where(txWhere);

  const custIds = [...new Set(txRows.map((t) => t.customerId).filter(Boolean))];
  const custRows = custIds.length
    ? await db.select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName }).from(customers).where(inArray(customers.id, custIds))
    : [];
  const custMap = Object.fromEntries(custRows.map((c) => [c.id, c]));

  const txByMobile = txRows.reduce((acc, t) => {
    const { mobileId, customerId, ...rest } = t;
    (acc[mobileId] ??= []).push({ ...rest, customer: custMap[customerId] ?? null });
    return acc;
  }, {});

  const result = rows.map((m) => ({ ...m, transactions: txByMobile[m.id] ?? [] }));
  res.respond(200, req.t("user.mobilesFetched"), { mobiles: result, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/users/:id/customers
export const getUserCustomers = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { q } = req.query;

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!userRow) return res.respond(404, req.t("user.notFound"));

  const filters = [eq(customers.addedBy, userId)];
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(like(customers.firstName, t), like(customers.lastName, t), like(customers.phoneNumber, t), like(customers.idCardNumber, t)));
  }
  const where = and(...filters);

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: customers.id, firstName: customers.firstName, lastName: customers.lastName,
      gender: customers.gender, phoneNumber: customers.phoneNumber,
      idCardNumber: customers.idCardNumber, createdAt: customers.createdAt,
    }).from(customers).where(where).orderBy(sql`${customers.createdAt} desc`).limit(limit).offset(offset),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(customers).where(where),
  ]);

  res.respond(200, req.t("user.customersFetched"), { customers: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/users/:id/transactions
export const getUserTransactions = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { type } = req.query;

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!userRow) return res.respond(404, req.t("user.notFound"));

  const filters = [eq(transactions.userId, userId)];
  if (type) filters.push(eq(transactions.type, type));
  const where = and(...filters);

  const [rows, [{ total }]] = await Promise.all([
    db.query.transactions.findMany({
      where,
      limit, offset,
      orderBy: (tx, { desc }) => [desc(tx.createdAt)],
      with: {
        mobile:   { columns: { id: true, imei1: true, brand: true, model: true } },
        customer: { columns: { id: true, firstName: true, lastName: true, phoneNumber: true } },
      },
    }),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(transactions).where(where),
  ]);

  res.respond(200, req.t("user.transactionsFetched"), { transactions: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// POST /admin/users
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, shopNumber } = req.body;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return res.respond(400, req.t("user.emailExists"));

  const [user] = await db.insert(users).values({ name, email, password: await hashPassword(password), role: role || "user", phone, shopNumber }).returning(userCols);
  res.respond(201, req.t("user.created"), { user });
});

// PATCH /admin/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, password, role, phone, shopNumber } = req.body;

  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) return res.respond(404, req.t("user.notFound"));

  if (email && email !== existing.email) {
    const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (emailTaken) return res.respond(400, req.t("user.emailExists"));
  }

  if (role && role !== "admin" && existing.role === "admin" && existing.id === 1)
    return res.respond(400, req.t("user.cannotChangeAdminRole"));

  const data = {};
  if (name)       data.name       = name;
  if (email)      data.email      = email;
  if (role)       data.role       = role;
  if (phone)      data.phone      = phone;
  if (shopNumber) data.shopNumber = shopNumber;
  if (password)   data.password   = await hashPassword(password);

  if (!Object.keys(data).length) return res.respond(400, req.t("user.noFields"));

  data.updatedAt = new Date().toISOString();
  const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning(userCols);
  res.respond(200, req.t("user.updated"), { user });
});

// DELETE /admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id));
  if (!existing) return res.respond(404, req.t("user.notFound"));
  if (existing.id === req.user.id) return res.respond(400, req.t("user.cannotDeleteSelf"));
  if (existing.id === 1) return res.respond(400, req.t("user.cannotDeleteAdmin"));
  await db.delete(users).where(eq(users.id, id));
  res.respond(200, req.t("user.deleted"));
});

import { eq, or, like, and, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import { hashPassword } from "../../utils/hash.util.js";
import db from "../../configs/db/db.config.js";
import { users, transactions, customers, mobiles } from "../../db/schema.js";

const userCols = {
  id: users.id, name: users.name, email: users.email, phone: users.phone,
  shopNumber: users.shopNumber, idCardNumber: users.idCardNumber, address: users.address,
  role: users.role, isActive: users.isActive, createdAt: users.createdAt, updatedAt: users.updatedAt,
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
  const { q, brand, model, color, imei } = req.query;

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (!userRow) return res.respond(404, req.t("user.notFound"));

  const mFilters = [];
  if (brand) mFilters.push(like(mobiles.brand, `%${brand.trim()}%`));
  if (model) mFilters.push(like(mobiles.model, `%${model.trim()}%`));
  if (color) mFilters.push(like(mobiles.color, `%${color.trim()}%`));
  if (imei) {
    const t = `%${imei.trim()}%`;
    mFilters.push(or(like(mobiles.imei1, t), like(mobiles.imei2, t)));
  }
  if (q) {
    const t = `%${q.trim()}%`;
    mFilters.push(or(like(mobiles.imei1, t), like(mobiles.imei2, t), like(mobiles.brand, t), like(mobiles.model, t)));
  }

  const txFilters = [eq(transactions.userId, userId)];
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

  res.respond(200, req.t("user.mobilesFetched"), { mobiles: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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
  const { name, email, password, role, phone, shopNumber, idCardNumber, address } = req.body;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return res.respond(400, req.t("user.emailExists"));

  const [user] = await db.insert(users).values({ name, email, password: await hashPassword(password), role: role || "user", phone, shopNumber, idCardNumber, address }).returning(userCols);
  res.respond(201, req.t("user.created"), { user });
});

// PATCH /admin/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, password, role, phone, shopNumber, idCardNumber, address } = req.body;

  const [existing] = await db.select().from(users).where(eq(users.id, id));
  if (!existing) return res.respond(404, req.t("user.notFound"));

  const seededAdminEmail = process.env.SEEDED_ADMIN_EMAIL;
  if (seededAdminEmail && existing.email === seededAdminEmail)
    return res.respond(403, req.t("user.cannotModifySeededAdmin"));

  if (email && email !== existing.email) {
    const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (emailTaken) return res.respond(400, req.t("user.emailExists"));
  }

  const data = {};
  if (name        !== undefined) data.name        = name;
  if (email       !== undefined) data.email       = email;
  if (role        !== undefined) data.role        = role;
  if (phone       !== undefined) data.phone       = phone;
  if (shopNumber  !== undefined) data.shopNumber  = shopNumber;
  if (idCardNumber !== undefined) data.idCardNumber = idCardNumber;
  if (address     !== undefined) data.address     = address;
  if (password)                  data.password    = await hashPassword(password);

  if (!Object.keys(data).length) return res.respond(400, req.t("user.noFields"));

  data.updatedAt = new Date().toISOString();
  const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning(userCols);
  res.respond(200, req.t("user.updated"), { user });
});

// PATCH /admin/users/:id/toggle-active
export const toggleUserActive = asyncHandler(async (req, res) => {
  const requesterId    = req.user.id;
  const requesterEmail = req.user.email;
  const targetId       = parseInt(req.params.id);
  const seededAdminEmail = process.env.SEEDED_ADMIN_EMAIL;

  // Only the primary admin can toggle
  if (seededAdminEmail) {
    if (requesterEmail !== seededAdminEmail)
      return res.respond(403, req.t("user.onlyPrimaryAdmin"));
  } else {
    const [primaryAdmin] = await db.select({ id: users.id }).from(users).orderBy(sql`${users.id} asc`).limit(1);
    if (!primaryAdmin || primaryAdmin.id !== requesterId)
      return res.respond(403, req.t("user.onlyPrimaryAdmin"));
  }

  const [target] = await db.select().from(users).where(eq(users.id, targetId));
  if (!target) return res.respond(404, req.t("user.notFound"));
  if (target.id === requesterId) return res.respond(400, req.t("user.cannotDeactivateSelf"));
  if (seededAdminEmail && target.email === seededAdminEmail)
    return res.respond(403, req.t("user.cannotModifySeededAdmin"));

  const newStatus  = !target.isActive;
  const updateData = { isActive: newStatus, updatedAt: new Date().toISOString() };
  if (!newStatus) updateData.refreshToken = null;

  const [user] = await db.update(users).set(updateData).where(eq(users.id, targetId)).returning(userCols);
  res.respond(200, newStatus ? req.t("user.activated") : req.t("user.deactivated"), { user });
});

// DELETE /admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, id));
  if (!existing) return res.respond(404, req.t("user.notFound"));
  if (existing.id === req.user.id) return res.respond(400, req.t("user.cannotDeleteSelf"));

  const seededAdminEmail = process.env.SEEDED_ADMIN_EMAIL;
  if (seededAdminEmail && existing.email === seededAdminEmail)
    return res.respond(403, req.t("user.cannotModifySeededAdmin"));

  await db.delete(users).where(eq(users.id, id));
  res.respond(200, req.t("user.deleted"));
});

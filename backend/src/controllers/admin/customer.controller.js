import { eq, or, like, and, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import { deleteImage } from "../../utils/cloudinary.util.js";
import db from "../../configs/db/db.config.js";
import { customers } from "../../db/schema.js";

const customerWith = {
  user:      { columns: { id: true, name: true, email: true, shopNumber: true } },
  addresses: { columns: { id: true, type: true, province: true, city: true, district: true, street: true, postalCode: true } },
  transactions: {
    orderBy: (tx, { desc }) => [desc(tx.createdAt)],
    columns: { id: true, type: true, price: true, createdAt: true },
    with: { mobile: { columns: { id: true, imei1: true, brand: true, model: true } } },
  },
};

const customerCols = {
  id: customers.id, firstName: customers.firstName, lastName: customers.lastName,
  gender: customers.gender, idCardNumber: customers.idCardNumber, phoneNumber: customers.phoneNumber,
  idImage: customers.idImage, idImagePublicId: customers.idImagePublicId,
  addedBy: customers.addedBy, createdAt: customers.createdAt, updatedAt: customers.updatedAt,
};

// GET /admin/customers
export const getAllCustomers = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { q, idCardNumber, phoneNumber, userId } = req.query;

  const filters = [];
  if (userId)       filters.push(eq(customers.addedBy, parseInt(userId)));
  if (idCardNumber) filters.push(like(customers.idCardNumber, `%${idCardNumber.trim()}%`));
  if (phoneNumber)  filters.push(like(customers.phoneNumber,  `%${phoneNumber.trim()}%`));
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(like(customers.firstName, t), like(customers.lastName, t), like(customers.idCardNumber, t), like(customers.phoneNumber, t)));
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.customers.findMany({ where, limit, offset, orderBy: (c, { desc }) => [desc(c.createdAt)], with: customerWith }),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(customers).where(where),
  ]);

  res.respond(200, req.t("customer.fetched"), { customers: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/customers/:id
export const getCustomerById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const customer = await db.query.customers.findFirst({ where: (c, { eq: eqFn }) => eqFn(c.id, id), with: customerWith });
  if (!customer) return res.respond(404, req.t("customer.notFound"));
  res.respond(200, req.t("customer.fetchedOne"), { customer });
});

// PATCH /admin/customers/:id
export const updateCustomer = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(customers).where(eq(customers.id, id));
  if (!existing) return res.respond(404, req.t("customer.notFound"));

  const { firstName, lastName, gender, idCardNumber, phoneNumber } = req.body;
  const data = {};
  if (firstName)    data.firstName    = firstName;
  if (lastName)     data.lastName     = lastName;
  if (gender)       data.gender       = gender;
  if (idCardNumber) data.idCardNumber = idCardNumber;
  if (phoneNumber)  data.phoneNumber  = phoneNumber;

  if (req.file?.secure_url) {
    if (existing.idImagePublicId) await deleteImage(existing.idImagePublicId).catch(() => {});
    data.idImage         = req.file.secure_url;
    data.idImagePublicId = req.file.public_id;
  }

  data.updatedAt = new Date().toISOString();
  await db.update(customers).set(data).where(eq(customers.id, id));
  const customer = await db.query.customers.findFirst({ where: (c, { eq: eqFn }) => eqFn(c.id, id), with: customerWith });
  res.respond(200, req.t("customer.updated"), { customer });
});

// DELETE /admin/customers/:id
export const deleteCustomer = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(customers).where(eq(customers.id, id));
  if (!existing) return res.respond(404, req.t("customer.notFound"));
  if (existing.idImagePublicId) await deleteImage(existing.idImagePublicId).catch(() => {});
  await db.delete(customers).where(eq(customers.id, id));
  res.respond(200, req.t("customer.deleted"));
});

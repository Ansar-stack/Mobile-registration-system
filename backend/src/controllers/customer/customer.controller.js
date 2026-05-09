import { eq, or, like, and, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import { deleteImage } from "../../utils/cloudinary.util.js";
import db from "../../configs/db/db.config.js";
import { customers, addresses } from "../../db/schema.js";

const addrWith = {
  addresses: { columns: { id: true, type: true, province: true, city: true, district: true, street: true, postalCode: true } },
};

const customerCols = {
  id: customers.id, firstName: customers.firstName, lastName: customers.lastName,
  gender: customers.gender, idCardNumber: customers.idCardNumber, phoneNumber: customers.phoneNumber,
  idImage: customers.idImage, idImagePublicId: customers.idImagePublicId,
  addedBy: customers.addedBy, createdAt: customers.createdAt, updatedAt: customers.updatedAt,
};

// GET /customers
export const getMyCustomers = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { q, idCardNumber, phoneNumber } = req.query;

  const filters = [eq(customers.addedBy, req.user.id)];
  if (idCardNumber) filters.push(like(customers.idCardNumber, `%${idCardNumber.trim()}%`));
  if (phoneNumber)  filters.push(like(customers.phoneNumber,  `%${phoneNumber.trim()}%`));
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(like(customers.firstName, t), like(customers.lastName, t), like(customers.idCardNumber, t), like(customers.phoneNumber, t)));
  }
  const where = and(...filters);

  const [rows, [{ total }]] = await Promise.all([
    db.query.customers.findMany({ where, limit, offset, orderBy: (c, { desc }) => [desc(c.createdAt)], with: addrWith }),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(customers).where(where),
  ]);

  res.respond(200, req.t("customer.fetched"), { customers: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /customers/:id
export const getCustomerById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const customer = await db.query.customers.findFirst({ where: (c, { eq: eqFn }) => eqFn(c.id, id), with: addrWith });
  if (!customer)                        return res.respond(404, req.t("customer.notFound"));
  if (customer.addedBy !== req.user.id) return res.respond(403, req.t("customer.forbidden"));
  res.respond(200, req.t("customer.fetchedOne"), { customer });
});

// POST /customers
export const createCustomer = asyncHandler(async (req, res) => {
  const { firstName, lastName, gender, idCardNumber, phoneNumber } = req.body;

  // addresses arrive as a JSON string when sent via FormData
  let permanentAddress = null;
  let currentAddress   = null;
  try {
    const parsed = req.body.addresses ? JSON.parse(req.body.addresses) : {};
    permanentAddress = parsed.permanent || null;
    currentAddress   = parsed.current   || null;
  } catch {
    // if already parsed as object (JSON body), fall back
    permanentAddress = req.body.permanentAddress || null;
    currentAddress   = req.body.currentAddress   || null;
  }

  const existing = await db.query.customers.findFirst({ where: (c, { eq: eqFn }) => eqFn(c.idCardNumber, idCardNumber), with: addrWith });
  if (existing) return res.respond(200, req.t("customer.alreadyExists"), { customer: existing });

  const [phoneConflict] = await db.select({ id: customers.id }).from(customers).where(eq(customers.phoneNumber, phoneNumber));
  if (phoneConflict) return res.respond(400, req.t("customer.phoneConflict"));

  const idImage         = req.file?.secure_url || null;
  const idImagePublicId = req.file?.public_id   || null;

  const [customer] = await db.insert(customers).values({ firstName, lastName, gender, idCardNumber, phoneNumber, idImage, idImagePublicId, addedBy: req.user.id }).returning(customerCols);

  const addrInserts = [
    ...(permanentAddress ? [{ type: "PERMANENT", province: permanentAddress.province || null, city: permanentAddress.city || null, district: permanentAddress.district || null, customerId: customer.id }] : []),
    ...(currentAddress   ? [{ type: "CURRENT",   province: currentAddress.province   || null, city: currentAddress.city   || null, district: currentAddress.district   || null, customerId: customer.id }] : []),
  ];
  if (addrInserts.length) await db.insert(addresses).values(addrInserts);

  const result = await db.query.customers.findFirst({ where: (c, { eq: eqFn }) => eqFn(c.id, customer.id), with: addrWith });
  res.respond(201, req.t("customer.created"), { customer: result });
});

// PATCH /customers/:id
export const updateCustomer = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(customers).where(eq(customers.id, id));
  if (!existing)                        return res.respond(404, req.t("customer.notFound"));
  if (existing.addedBy !== req.user.id) return res.respond(403, req.t("customer.forbidden"));

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
  const customer = await db.query.customers.findFirst({ where: (c, { eq: eqFn }) => eqFn(c.id, id), with: addrWith });
  res.respond(200, req.t("customer.updated"), { customer });
});

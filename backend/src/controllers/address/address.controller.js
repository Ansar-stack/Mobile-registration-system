import { eq, and } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import { withinFiveMinutes } from "../../utils/withinFiveMinutes.util.js";
import db from "../../configs/db/db.config.js";
import { addresses, customers } from "../../db/schema.js";

const addressCols = {
  id: addresses.id, type: addresses.type, province: addresses.province,
  city: addresses.city, district: addresses.district, street: addresses.street,
  postalCode: addresses.postalCode, customerId: addresses.customerId,
  createdAt: addresses.createdAt, updatedAt: addresses.updatedAt,
};

// GET /customers/:customerId/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const customerId = parseInt(req.params.customerId);

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer)                        return res.respond(404, req.t("address.customerNotFound"));
  if (customer.addedBy !== req.user.id) return res.respond(403, req.t("address.forbidden"));

  const rows = await db.select(addressCols).from(addresses).where(eq(addresses.customerId, customerId));
  res.respond(200, req.t("address.fetched"), { addresses: rows });
});

// POST /customers/:customerId/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const { type, province, city, district, street, postalCode } = req.body;

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer)                        return res.respond(404, req.t("address.customerNotFound"));
  if (customer.addedBy !== req.user.id) return res.respond(403, req.t("address.forbidden"));
  if (!withinFiveMinutes(customer.createdAt)) return res.respond(403, req.t("address.timeExpired"));

  const [existing] = await db.select().from(addresses).where(and(eq(addresses.customerId, customerId), eq(addresses.type, type)));
  if (existing) return res.respond(400, `${type} ${req.t("address.typeExists")}`);

  const [address] = await db.insert(addresses).values({ type, province, city, district, street, postalCode, customerId }).returning(addressCols);
  res.respond(201, req.t("address.added"), { address });
});

// PATCH /customers/:customerId/addresses/:id
export const updateAddress = asyncHandler(async (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const id         = parseInt(req.params.id);
  const { province, city, district, street, postalCode } = req.body;

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer)                        return res.respond(404, req.t("address.customerNotFound"));
  if (customer.addedBy !== req.user.id) return res.respond(403, req.t("address.forbidden"));
  if (!withinFiveMinutes(customer.createdAt)) return res.respond(403, req.t("address.updateTimeExpired"));

  const [existing] = await db.select().from(addresses).where(eq(addresses.id, id));
  if (!existing || existing.customerId !== customerId) return res.respond(404, req.t("address.notFound"));

  const data = {};
  if (province   !== undefined) data.province   = province;
  if (city       !== undefined) data.city       = city;
  if (district   !== undefined) data.district   = district;
  if (street     !== undefined) data.street     = street;
  if (postalCode !== undefined) data.postalCode = postalCode;

  if (!Object.keys(data).length) return res.respond(400, req.t("address.noFields"));

  data.updatedAt = new Date().toISOString();
  const [address] = await db.update(addresses).set(data).where(eq(addresses.id, id)).returning(addressCols);
  res.respond(200, req.t("address.updated"), { address });
});

// DELETE /customers/:customerId/addresses/:id
export const deleteAddress = asyncHandler(async (req, res) => {
  const customerId = parseInt(req.params.customerId);
  const id         = parseInt(req.params.id);

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer)                        return res.respond(404, req.t("address.customerNotFound"));
  if (customer.addedBy !== req.user.id) return res.respond(403, req.t("address.forbidden"));
  if (!withinFiveMinutes(customer.createdAt)) return res.respond(403, req.t("address.deleteTimeExpired"));

  const [existing] = await db.select().from(addresses).where(eq(addresses.id, id));
  if (!existing || existing.customerId !== customerId) return res.respond(404, req.t("address.notFound"));

  await db.delete(addresses).where(eq(addresses.id, id));
  res.respond(200, req.t("address.deleted"));
});

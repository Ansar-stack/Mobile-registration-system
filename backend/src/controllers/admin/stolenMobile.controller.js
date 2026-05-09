import { eq, or, like, and, sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { stolenMobiles, mobiles, transactions, notifications, detectedStolenMobiles } from "../../db/schema.js";

const stolenCols = {
  id: stolenMobiles.id, imei1: stolenMobiles.imei1, imei2: stolenMobiles.imei2,
  brand: stolenMobiles.brand, model: stolenMobiles.model, color: stolenMobiles.color,
  ram: stolenMobiles.ram, storage: stolenMobiles.storage,
  reporterName: stolenMobiles.reporterName, reporterPhone: stolenMobiles.reporterPhone,
  createdAt: stolenMobiles.createdAt, updatedAt: stolenMobiles.updatedAt,
};

const checkExistingMobileMatch = async (imei1, imei2) => {
  const imeiConditions = [
    eq(mobiles.imei1, imei1),
    ...(imei2 ? [eq(mobiles.imei2, imei1), eq(mobiles.imei1, imei2), eq(mobiles.imei2, imei2)] : []),
  ];
  return db
    .select({ 
      id: mobiles.id, 
      imei1: mobiles.imei1, 
      brand: mobiles.brand, 
      model: mobiles.model,
      transactionId: transactions.id 
    })
    .from(mobiles)
    .innerJoin(transactions, eq(transactions.mobileId, mobiles.id))
    .where(or(...imeiConditions))
    .limit(5);
};

// GET /admin/stolen-mobiles
export const getStolenMobiles = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { q, brand, model, color, imei, reporterName, reporterPhone } = req.query;

  const filters = [];
  if (brand) filters.push(like(stolenMobiles.brand, `%${brand.trim()}%`));
  if (model) filters.push(like(stolenMobiles.model, `%${model.trim()}%`));
  if (color) filters.push(like(stolenMobiles.color, `%${color.trim()}%`));
  if (imei) {
    const t = `%${imei.trim()}%`;
    filters.push(or(like(stolenMobiles.imei1, t), like(stolenMobiles.imei2, t)));
  }
  if (reporterName) {
    filters.push(like(stolenMobiles.reporterName, `%${reporterName.trim()}%`));
  }
  if (reporterPhone) {
    filters.push(like(stolenMobiles.reporterPhone, `%${reporterPhone.trim()}%`));
  }
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(
      like(stolenMobiles.imei1, t), 
      like(stolenMobiles.imei2, t), 
      like(stolenMobiles.brand, t), 
      like(stolenMobiles.model, t), 
      like(stolenMobiles.color, t),
      like(stolenMobiles.reporterName, t),
      like(stolenMobiles.reporterPhone, t)
    ));
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select(stolenCols).from(stolenMobiles).where(where).orderBy(sql`${stolenMobiles.createdAt} desc`).limit(limit).offset(offset),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(stolenMobiles).where(where),
  ]);

  res.respond(200, req.t("stolenMobile.fetched"), { stolenMobiles: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /admin/stolen-mobiles/:id
export const getStolenMobileById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [stolenMobile] = await db.select(stolenCols).from(stolenMobiles).where(eq(stolenMobiles.id, id));
  if (!stolenMobile) return res.respond(404, req.t("stolenMobile.notFound"));
  res.respond(200, req.t("stolenMobile.fetchedOne"), { stolenMobile });
});

// POST /admin/stolen-mobiles
export const createStolenMobile = asyncHandler(async (req, res) => {
  const { imei1, imei2, brand, model, color, ram, storage, reporterName, reporterPhone } = req.body;

  const imeiOr = [eq(stolenMobiles.imei1, imei1), ...(imei2 ? [eq(stolenMobiles.imei2, imei2)] : [])];
  const [existing] = await db.select({ id: stolenMobiles.id }).from(stolenMobiles).where(or(...imeiOr));
  if (existing) return res.respond(400, req.t("stolenMobile.imeiExists"));

  const [stolenMobile] = await db
    .insert(stolenMobiles)
    .values({ imei1, imei2, brand, model, color, ram, storage, reporterName, reporterPhone })
    .returning(stolenCols);

  checkExistingMobileMatch(imei1, imei2)
    .then(async (matches) => {
      if (!matches.length) return;
      
      // Create notifications
      const notifInserts = matches.map((m) => ({
        type: "STOLEN_MATCH",
        imei: m.imei1,
        message: `Stolen mobile report for IMEI ${imei1} matches a registered transaction — ${m.brand} ${m.model} (IMEI: ${m.imei1})`,
        mobileId: m.id,
      }));
      await db.insert(notifications).values(notifInserts);
      
      // Create detected stolen mobile records
      const detectedInserts = matches.map((m) => ({
        stolenMobileId: stolenMobile.id,
        mobileId: m.id,
        transactionId: m.transactionId,
      }));
      await db.insert(detectedStolenMobiles).values(detectedInserts).onConflictDoNothing();
    })
    .catch(() => {});

  res.respond(201, req.t("stolenMobile.added"), { stolenMobile });
});

// PATCH /admin/stolen-mobiles/:id
export const updateStolenMobile = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { imei1, imei2, brand, model, color, ram, storage, reporterName, reporterPhone } = req.body;

  const [existing] = await db.select().from(stolenMobiles).where(eq(stolenMobiles.id, id));
  if (!existing) return res.respond(404, req.t("stolenMobile.notFound"));

  if (imei1 && imei1 !== existing.imei1) {
    const [taken] = await db.select({ id: stolenMobiles.id }).from(stolenMobiles).where(eq(stolenMobiles.imei1, imei1));
    if (taken) return res.respond(400, req.t("stolenMobile.imei1Exists"));
  }
  if (imei2 && imei2 !== existing.imei2) {
    const [taken] = await db.select({ id: stolenMobiles.id }).from(stolenMobiles).where(eq(stolenMobiles.imei2, imei2));
    if (taken) return res.respond(400, req.t("stolenMobile.imei2Exists"));
  }

  const data = {};
  if (imei1)         data.imei1         = imei1;
  if (imei2)         data.imei2         = imei2;
  if (brand)         data.brand         = brand;
  if (model)         data.model         = model;
  if (color)         data.color         = color;
  if (ram)           data.ram           = ram;
  if (storage)       data.storage       = storage;
  if (reporterName)  data.reporterName  = reporterName;
  if (reporterPhone) data.reporterPhone = reporterPhone;

  if (!Object.keys(data).length) return res.respond(400, req.t("stolenMobile.noFields"));

  data.updatedAt = new Date().toISOString();
  const [stolenMobile] = await db.update(stolenMobiles).set(data).where(eq(stolenMobiles.id, id)).returning(stolenCols);

  const newImei1 = imei1 ?? existing.imei1;
  const newImei2 = imei2 ?? existing.imei2;
  const imeiChanged = (imei1 && imei1 !== existing.imei1) || (imei2 && imei2 !== existing.imei2);
  if (imeiChanged) {
    checkExistingMobileMatch(newImei1, newImei2)
      .then(async (matches) => {
        if (!matches.length) return;
        
        // Create notifications
        const notifInserts = matches.map((m) => ({
          type: "STOLEN_MATCH",
          imei: m.imei1,
          message: `Updated stolen mobile report for IMEI ${newImei1} matches a registered transaction — ${m.brand} ${m.model} (IMEI: ${m.imei1})`,
          mobileId: m.id,
        }));
        await db.insert(notifications).values(notifInserts);
        
        // Create detected stolen mobile records
        const detectedInserts = matches.map((m) => ({
          stolenMobileId: id,
          mobileId: m.id,
          transactionId: m.transactionId,
        }));
        await db.insert(detectedStolenMobiles).values(detectedInserts).onConflictDoNothing();
      })
      .catch(() => {});
  }

  res.respond(200, req.t("stolenMobile.updated"), { stolenMobile });
});

// DELETE /admin/stolen-mobiles/:id
export const deleteStolenMobile = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select({ id: stolenMobiles.id }).from(stolenMobiles).where(eq(stolenMobiles.id, id));
  if (!existing) return res.respond(404, req.t("stolenMobile.notFound"));
  await db.delete(stolenMobiles).where(eq(stolenMobiles.id, id));
  res.respond(200, req.t("stolenMobile.deleted"));
});

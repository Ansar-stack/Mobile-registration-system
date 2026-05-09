import { eq, or, like, and, sql, desc } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import { 
  detectedStolenMobiles, 
  stolenMobiles, 
  mobiles, 
  transactions, 
  users, 
  customers 
} from "../../db/schema.js";

// GET /admin/detected-stolen-mobiles
export const getDetectedStolenMobiles = asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  
  // Filter parameters
  const { 
    q, 
    imei, 
    reporterName, 
    reporterPhone,
    brand,
    model,
    stolenMobileId,
    mobileId,
    transactionId,
    startDate,
    endDate
  } = req.query;

  const filters = [];
  
  // IMEI filter (search in stolen mobile IMEI or mobile IMEI)
  if (imei) {
    const t = `%${imei.trim()}%`;
    filters.push(or(
      like(stolenMobiles.imei1, t),
      like(stolenMobiles.imei2, t),
      like(mobiles.imei1, t),
      like(mobiles.imei2, t)
    ));
  }
  
  // Reporter name filter
  if (reporterName) {
    filters.push(like(stolenMobiles.reporterName, `%${reporterName.trim()}%`));
  }
  
  // Reporter phone filter
  if (reporterPhone) {
    filters.push(like(stolenMobiles.reporterPhone, `%${reporterPhone.trim()}%`));
  }
  
  // Brand filter
  if (brand) {
    const t = `%${brand.trim()}%`;
    filters.push(or(
      like(stolenMobiles.brand, t),
      like(mobiles.brand, t)
    ));
  }
  
  // Model filter
  if (model) {
    const t = `%${model.trim()}%`;
    filters.push(or(
      like(stolenMobiles.model, t),
      like(mobiles.model, t)
    ));
  }
  
  // ID filters
  if (stolenMobileId) {
    filters.push(eq(detectedStolenMobiles.stolenMobileId, parseInt(stolenMobileId)));
  }
  
  if (mobileId) {
    filters.push(eq(detectedStolenMobiles.mobileId, parseInt(mobileId)));
  }
  
  if (transactionId) {
    filters.push(eq(detectedStolenMobiles.transactionId, parseInt(transactionId)));
  }
  
  // Date range filter
  if (startDate) {
    filters.push(sql`${detectedStolenMobiles.detectedAt} >= ${startDate}`);
  }
  
  if (endDate) {
    filters.push(sql`${detectedStolenMobiles.detectedAt} <= ${endDate}`);
  }
  
  // General search (q parameter)
  if (q) {
    const t = `%${q.trim()}%`;
    filters.push(or(
      like(stolenMobiles.imei1, t),
      like(stolenMobiles.imei2, t),
      like(stolenMobiles.brand, t),
      like(stolenMobiles.model, t),
      like(stolenMobiles.reporterName, t),
      like(stolenMobiles.reporterPhone, t),
      like(mobiles.imei1, t),
      like(mobiles.imei2, t),
      like(mobiles.brand, t),
      like(mobiles.model, t)
    ));
  }
  
  const where = filters.length ? and(...filters) : undefined;

  // Get detected stolen mobiles with related data
  const [rows, [{ total }]] = await Promise.all([
    db.query.detectedStolenMobiles.findMany({
      where,
      limit,
      offset,
      orderBy: (dsm, { desc }) => [desc(dsm.detectedAt)],
      with: {
        stolenMobile: {
          columns: {
            id: true,
            imei1: true,
            imei2: true,
            brand: true,
            model: true,
            color: true,
            ram: true,
            storage: true,
            reporterName: true,
            reporterPhone: true,
            createdAt: true
          }
        },
        mobile: {
          columns: {
            id: true,
            imei1: true,
            imei2: true,
            brand: true,
            model: true,
            color: true,
            ram: true,
            storage: true,
            createdAt: true
          }
        },
        transaction: {
          columns: {
            id: true,
            type: true,
            price: true,
            notes: true,
            createdAt: true
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                phone: true,
                shopNumber: true
              }
            },
            customer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                idCardNumber: true
              }
            }
          }
        }
      }
    }),
    
    db.select({ total: sql`count(*)`.mapWith(Number) })
      .from(detectedStolenMobiles)
      .leftJoin(stolenMobiles, eq(detectedStolenMobiles.stolenMobileId, stolenMobiles.id))
      .leftJoin(mobiles, eq(detectedStolenMobiles.mobileId, mobiles.id))
      .where(where)
  ]);

  res.respond(200, req.t("detectedStolenMobile.fetched"), { 
    detectedStolenMobiles: rows, 
    pagination: { 
      total, 
      page, 
      limit, 
      totalPages: Math.ceil(total / limit) 
    } 
  });
});

// GET /admin/detected-stolen-mobiles/:id
export const getDetectedStolenMobileById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  const detectedStolenMobile = await db.query.detectedStolenMobiles.findFirst({
    where: (dsm, { eq: eqFn }) => eqFn(dsm.id, id),
    with: {
      stolenMobile: {
        columns: {
          id: true,
          imei1: true,
          imei2: true,
          brand: true,
          model: true,
          color: true,
          ram: true,
          storage: true,
          reporterName: true,
          reporterPhone: true,
          createdAt: true
        }
      },
      mobile: {
        columns: {
          id: true,
          imei1: true,
          imei2: true,
          brand: true,
          model: true,
          color: true,
          ram: true,
          storage: true,
          createdAt: true
        }
      },
      transaction: {
        columns: {
          id: true,
          type: true,
          price: true,
          notes: true,
          createdAt: true
        },
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              phone: true,
              shopNumber: true
            }
          },
          customer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              idCardNumber: true
            }
          }
        }
      }
    }
  });
  
  if (!detectedStolenMobile) {
    return res.respond(404, req.t("detectedStolenMobile.notFound"));
  }
  
  res.respond(200, req.t("detectedStolenMobile.fetchedOne"), { detectedStolenMobile });
});

// DELETE /admin/detected-stolen-mobiles/:id
export const deleteDetectedStolenMobile = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  const [existing] = await db.select({ id: detectedStolenMobiles.id })
    .from(detectedStolenMobiles)
    .where(eq(detectedStolenMobiles.id, id));
    
  if (!existing) {
    return res.respond(404, req.t("detectedStolenMobile.notFound"));
  }
  
  await db.delete(detectedStolenMobiles).where(eq(detectedStolenMobiles.id, id));
  
  res.respond(200, req.t("detectedStolenMobile.deleted"));
});

// GET /admin/detected-stolen-mobiles/stats
export const getDetectedStolenMobileStats = asyncHandler(async (req, res) => {
  const [[{ totalDetected }], [{ uniqueStolenMobilesDetected }], [{ detectedLast7Days }], [{ detectedLast30Days }]] = await Promise.all([
    db.select({ totalDetected: sql`count(*)`.mapWith(Number) }).from(detectedStolenMobiles),
    db.select({ uniqueStolenMobilesDetected: sql`count(distinct ${detectedStolenMobiles.stolenMobileId})`.mapWith(Number) }).from(detectedStolenMobiles),
    db.select({ detectedLast7Days: sql`count(*)`.mapWith(Number) }).from(detectedStolenMobiles).where(sql`${detectedStolenMobiles.detectedAt} >= datetime('now', '-7 days')`),
    db.select({ detectedLast30Days: sql`count(*)`.mapWith(Number) }).from(detectedStolenMobiles).where(sql`${detectedStolenMobiles.detectedAt} >= datetime('now', '-30 days')`),
  ]);

  const topBrands = await db
    .select({ brand: stolenMobiles.brand, count: sql`count(*)`.mapWith(Number) })
    .from(detectedStolenMobiles)
    .leftJoin(stolenMobiles, eq(detectedStolenMobiles.stolenMobileId, stolenMobiles.id))
    .groupBy(stolenMobiles.brand)
    .orderBy(desc(sql`count(*)`))  
    .limit(5);

  res.respond(200, req.t("detectedStolenMobile.statsFetched"), {
    stats: { totalDetected, uniqueStolenMobilesDetected, detectedLast7Days, detectedLast30Days },
    topBrands,
  });
});
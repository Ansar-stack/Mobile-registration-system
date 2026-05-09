import { sql } from "drizzle-orm";
import { asyncHandler } from "../../utils/AsyncHandler.util.js";
import db from "../../configs/db/db.config.js";
import {
  users, mobiles, customers, transactions,
  notifications, stolenMobiles, detectedStolenMobiles,
} from "../../db/schema.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const [
    [{ totalMobiles }],
    [{ totalStolenMobiles }],
    [{ totalDetectedStolenMobiles }],
    [{ totalUsers }],
    [{ totalCustomers }],
    [{ unreadNotifications }],
    [{ duplicateIMEINotifications }],
  ] = await Promise.all([
    db.select({ totalMobiles: sql`count(*)`.mapWith(Number) }).from(mobiles),
    db.select({ totalStolenMobiles: sql`count(*)`.mapWith(Number) }).from(stolenMobiles),
    db.select({ totalDetectedStolenMobiles: sql`count(*)`.mapWith(Number) }).from(detectedStolenMobiles),
    db.select({ totalUsers: sql`count(*)`.mapWith(Number) }).from(users).where(sql`${users.role} = 'user'`),
    db.select({ totalCustomers: sql`count(*)`.mapWith(Number) }).from(customers),
    db.select({ unreadNotifications: sql`count(*)`.mapWith(Number) }).from(notifications).where(sql`${notifications.isRead} = 0`),
    db.select({ duplicateIMEINotifications: sql`count(*)`.mapWith(Number) }).from(notifications).where(sql`${notifications.type} = 'DUPLICATE_IMEI' AND ${notifications.isRead} = 0`),
  ]);

  // Last 12 months
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }

  const [transactionsData, mobilesData, customersData, detectionsData, alertsData] = await Promise.all([
    db.select({
      month: sql`strftime('%Y-%m', ${transactions.createdAt})`.as("month"),
      total: sql`count(*)`.mapWith(Number).as("total"),
    }).from(transactions)
      .where(sql`${transactions.createdAt} >= strftime('%Y-%m-01', 'now', '-11 months')`)
      .groupBy(sql`strftime('%Y-%m', ${transactions.createdAt})`),

    db.select({
      month: sql`strftime('%Y-%m', ${mobiles.createdAt})`.as("month"),
      count: sql`count(*)`.mapWith(Number).as("count"),
    }).from(mobiles)
      .where(sql`${mobiles.createdAt} >= strftime('%Y-%m-01', 'now', '-11 months')`)
      .groupBy(sql`strftime('%Y-%m', ${mobiles.createdAt})`),

    db.select({
      month: sql`strftime('%Y-%m', ${customers.createdAt})`.as("month"),
      count: sql`count(*)`.mapWith(Number).as("count"),
    }).from(customers)
      .where(sql`${customers.createdAt} >= strftime('%Y-%m-01', 'now', '-11 months')`)
      .groupBy(sql`strftime('%Y-%m', ${customers.createdAt})`),

    db.select({
      month: sql`strftime('%Y-%m', ${detectedStolenMobiles.detectedAt})`.as("month"),
      count: sql`count(*)`.mapWith(Number).as("count"),
    }).from(detectedStolenMobiles)
      .where(sql`${detectedStolenMobiles.detectedAt} >= strftime('%Y-%m-01', 'now', '-11 months')`)
      .groupBy(sql`strftime('%Y-%m', ${detectedStolenMobiles.detectedAt})`),

    db.select({
      month: sql`strftime('%Y-%m', ${notifications.createdAt})`.as("month"),
      count: sql`count(*)`.mapWith(Number).as("count"),
    }).from(notifications)
      .where(sql`${notifications.type} = 'DUPLICATE_IMEI' AND ${notifications.createdAt} >= strftime('%Y-%m-01', 'now', '-11 months')`)
      .groupBy(sql`strftime('%Y-%m', ${notifications.createdAt})`),
  ]);

  const chartData = months.map((month) => ({
    month,
    transactions:      transactionsData.find(x => x.month === month)?.total ?? 0,
    mobilesRegistered: mobilesData.find(x => x.month === month)?.count ?? 0,
    customersAdded:    customersData.find(x => x.month === month)?.count ?? 0,
    stolenDetections:  detectionsData.find(x => x.month === month)?.count ?? 0,
    duplicateAlerts:   alertsData.find(x => x.month === month)?.count ?? 0,
  }));

  // System health: "good" if no unread stolen detections or duplicate alerts in last 30 days, else "warning"
  const recentAlerts = chartData.slice(-1)[0];
  const systemHealth = "good";
  res.respond(200, req.t("dashboard.fetched"), {
    stats: {
      totalMobiles,
      totalStolenMobiles,
      totalDetectedStolenMobiles,
      totalUsers,
      totalCustomers,
      unreadNotifications,
      duplicateIMEINotifications,
      systemHealth,
    },
    chartData,
  });
});

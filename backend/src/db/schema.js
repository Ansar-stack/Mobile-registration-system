import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ─── COMMON TIMESTAMPS ─────────────────────────────

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
};

// ─── USERS ─────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  shopNumber: text("shop_number"),
  role: text("role").notNull().default("user"),
  refreshToken: text("refresh_token"),
  ...timestamps,
});

// ─── MOBILES ───────────────────────────────────────

export const mobiles = sqliteTable("mobiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imei1: text("imei1").notNull().unique(),
  imei2: text("imei2"),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  color: text("color").notNull(),
  ram: text("ram"),
  storage: text("storage"),
  ...timestamps,
});

// ─── CUSTOMERS ─────────────────────────────────────

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender").notNull(),
  idCardNumber: text("id_card_number").notNull().unique(),
  phoneNumber: text("phone_number").notNull().unique(),
  idImage: text("id_image"),
  idImagePublicId: text("id_image_public_id"),

  addedBy: integer("added_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  ...timestamps,
});

// ─── ADDRESSES ─────────────────────────────────────

export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  province: text("province"),
  city: text("city"),
  district: text("district"),
  street: text("street"),
  postalCode: text("postal_code"),

  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),

  ...timestamps,
});

// ─── STOLEN MOBILES ────────────────────────────────

export const stolenMobiles = sqliteTable("stolen_mobiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imei1: text("imei1").notNull().unique(),
  imei2: text("imei2"),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  color: text("color"),
  ram: text("ram"),
  storage: text("storage"),

  reporterName: text("reporter_name").notNull(),
  reporterPhone: text("reporter_phone").notNull(),

  ...timestamps,
});

// ─── TRANSACTIONS ──────────────────────────────────

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  type: text("type").notNull(),
  price: real("price"),
  notes: text("notes"),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  mobileId: integer("mobile_id")
    .notNull()
    .references(() => mobiles.id, { onDelete: "cascade" }),

  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),

  ...timestamps,
});

// ─── NOTIFICATIONS ─────────────────────────────────

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  imei: text("imei").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),

  mobileId: integer("mobile_id").references(() => mobiles.id, {
    onDelete: "set null",
  }),

  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─── DETECTED STOLEN MOBILES ──────────────────────

export const detectedStolenMobiles = sqliteTable("detected_stolen_mobiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  stolenMobileId: integer("stolen_mobile_id")
    .notNull()
    .references(() => stolenMobiles.id, { onDelete: "cascade" }),

  mobileId: integer("mobile_id")
    .notNull()
    .references(() => mobiles.id, { onDelete: "cascade" }),

  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),

  detectedAt: text("detected_at").notNull().default(sql`(datetime('now'))`),
});

// ─── RELATIONS (FIXED & SAFE) ──────────────────────

// USERS
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  customers: many(customers),
  notifications: many(notifications),
}));

// MOBILES
export const mobilesRelations = relations(mobiles, ({ many }) => ({
  transactions: many(transactions),
  notifications: many(notifications),
}));

// CUSTOMERS
export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.addedBy],
    references: [users.id],
  }),
  transactions: many(transactions),
  addresses: many(addresses),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customerId],
    references: [customers.id],
  }),
}));

// TRANSACTIONS
export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  mobile: one(mobiles, {
    fields: [transactions.mobileId],
    references: [mobiles.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
}));

// NOTIFICATIONS
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  mobile: one(mobiles, {
    fields: [notifications.mobileId],
    references: [mobiles.id],
  }),
}));

// DETECTED STOLEN
export const detectedStolenRelations = relations(
  detectedStolenMobiles,
  ({ one }) => ({
    stolenMobile: one(stolenMobiles, {
      fields: [detectedStolenMobiles.stolenMobileId],
      references: [stolenMobiles.id],
    }),
    mobile: one(mobiles, {
      fields: [detectedStolenMobiles.mobileId],
      references: [mobiles.id],
    }),
    transaction: one(transactions, {
      fields: [detectedStolenMobiles.transactionId],
      references: [transactions.id],
    }),
  })
);
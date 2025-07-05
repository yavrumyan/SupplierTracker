import { pgTable, text, serial, integer, boolean, jsonb, timestamp, decimal, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  reputation: integer("reputation"), // 1-10 scale
  workingStyle: jsonb("working_style").$type<string[]>(), // Array of strings: B2B, PRICE-LISTS, INQUIRIES
  categories: jsonb("categories").$type<string[]>(), // Array of trading categories
  brands: jsonb("brands").$type<string[]>(), // Array of trading brands
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const priceListFiles = pgTable("price_list_files", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const priceListItems = pgTable("price_list_items", {
  id: serial("id").primaryKey(),
  priceListFileId: integer("price_list_file_id").references(() => priceListFiles.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  productName: text("product_name").notNull(),
  brand: text("brand"),
  category: text("category"),
  price: decimal("price", { precision: 10, scale: 2 }),
  stock: text("stock"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(), // 'whatsapp', 'email', 'manual'
  receivedAt: timestamp("received_at").defaultNow(),
  tags: jsonb("tags").$type<string[]>().default([]),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  orderNumber: text("order_number").notNull(),
  status: text("status").default("draft"), // draft, sent, confirmed, completed
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  itemNumber: integer("item_number").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sum: decimal("sum", { precision: 12, scale: 2 }).notNull(),
  approximateCost: decimal("approximate_cost", { precision: 12, scale: 2 }),
});

export const costCalculationFiles = pgTable("cost_calculation_files", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  supplierIds: jsonb("supplier_ids").$type<number[]>().notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").default("sent"), // sent, delivered, failed
});

// Relations
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  priceListFiles: many(priceListFiles),
  priceListItems: many(priceListItems),
  offers: many(offers),
  orders: many(orders),
  costCalculationFiles: many(costCalculationFiles),
}));

export const priceListFilesRelations = relations(priceListFiles, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [priceListFiles.supplierId],
    references: [suppliers.id],
  }),
  items: many(priceListItems),
}));

export const priceListItemsRelations = relations(priceListItems, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [priceListItems.supplierId],
    references: [suppliers.id],
  }),
  priceListFile: one(priceListFiles, {
    fields: [priceListItems.priceListFileId],
    references: [priceListFiles.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [offers.supplierId],
    references: [suppliers.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [orders.supplierId],
    references: [suppliers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const costCalculationFilesRelations = relations(costCalculationFiles, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [costCalculationFiles.supplierId],
    references: [suppliers.id],
  }),
}));

// Zod schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  website: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

export const insertPriceListFileSchema = createInsertSchema(priceListFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertPriceListItemSchema = createInsertSchema(priceListItems).omit({
  id: true,
  updatedAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  receivedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  sentAt: true,
  status: true,
});

// Types
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type PriceListFile = typeof priceListFiles.$inferSelect;
export type InsertPriceListFile = z.infer<typeof insertPriceListFileSchema>;
export type PriceListItem = typeof priceListItems.$inferSelect;
export type InsertPriceListItem = z.infer<typeof insertPriceListItemSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type CostCalculationFile = typeof costCalculationFiles.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

// Session storage table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User authentication table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

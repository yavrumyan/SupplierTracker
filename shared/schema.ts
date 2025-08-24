import { pgTable, text, serial, integer, boolean, jsonb, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
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
  workingStyle: jsonb("working_style").$type<string[]>().default([]), // Array of strings: B2B, PRICE-LISTS, INQUIRIES
  categories: jsonb("categories").$type<string[]>().default([]), // Array of trading categories
  brands: jsonb("brands").$type<string[]>().default([]), // Array of trading brands
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

export const searchIndex = pgTable("search_index", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  sourceType: text("source_type").notNull(), // 'price_list' or 'offer'
  sourceId: integer("source_id"), // Reference to price_list_files.id or offers.id
  supplier: text("supplier").notNull(),
  category: text("category"),
  brand: text("brand"),
  model: text("model"),
  productName: text("product_name"),
  price: text("price"),
  currency: text("currency"),
  stock: text("stock"),
  moq: text("moq"),
  warranty: text("warranty"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"), // MIME type
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Relations
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  priceListFiles: many(priceListFiles),
  priceListItems: many(priceListItems),
  offers: many(offers),
  orders: many(orders),
  costCalculationFiles: many(costCalculationFiles),
  searchIndex: many(searchIndex),
  documents: many(documents),
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

export const searchIndexRelations = relations(searchIndex, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [searchIndex.supplierId],
    references: [suppliers.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [documents.supplierId],
    references: [suppliers.id],
  }),
}));

// Zod schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertSearchIndexSchema = createInsertSchema(searchIndex).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
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
export type SearchIndex = typeof searchIndex.$inferSelect;
export type InsertSearchIndex = z.infer<typeof insertSearchIndexSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// User table (keeping existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// CompStyle Business Intelligence Tables (Separate from main supplier system)
export const compstyleLocations = pgTable("compstyle_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Kievyan 11" or "Sevan 5"
  type: text("type").notNull(), // "retail" or "warehouse"
  createdAt: timestamp("created_at").defaultNow(),
});

export const compstyleStock = pgTable("compstyle_stock", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  qty: integer("qty").notNull(),
  retail: decimal("retail", { precision: 10, scale: 2 }),
  dealer: decimal("dealer", { precision: 10, scale: 2 }),
  currentCost: decimal("current_cost", { precision: 10, scale: 2 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const compstyleLocationStock = pgTable("compstyle_location_stock", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  locationId: integer("location_id").references(() => compstyleLocations.id).notNull(),
  qty: integer("qty").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const compstyleSales = pgTable("compstyle_sales", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sold: integer("sold").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // "1M", "3M", "6M", "12M"
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const compstyleTransit = pgTable("compstyle_transit", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  upcoming: integer("upcoming").notNull(),
  purchase: decimal("purchase", { precision: 10, scale: 2 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const compstylePurchases = pgTable("compstyle_purchases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  purchased: integer("purchased").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // "1M", "3M", "6M", "12M"
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// CompStyle Relations
export const compstyleLocationStockRelations = relations(compstyleLocationStock, ({ one }) => ({
  location: one(compstyleLocations, {
    fields: [compstyleLocationStock.locationId],
    references: [compstyleLocations.id],
  }),
}));

export const compstyleLocationsRelations = relations(compstyleLocations, ({ many }) => ({
  locationStock: many(compstyleLocationStock),
}));

// CompStyle Zod schemas
export const insertCompstyleLocationSchema = createInsertSchema(compstyleLocations).omit({
  id: true,
  createdAt: true,
});

export const insertCompstyleStockSchema = createInsertSchema(compstyleStock).omit({
  id: true,
  uploadedAt: true,
});

export const insertCompstyleLocationStockSchema = createInsertSchema(compstyleLocationStock).omit({
  id: true,
  uploadedAt: true,
});

export const insertCompstyleSalesSchema = createInsertSchema(compstyleSales).omit({
  id: true,
  uploadedAt: true,
});

export const insertCompstyleTransitSchema = createInsertSchema(compstyleTransit).omit({
  id: true,
  uploadedAt: true,
});

export const insertCompstylePurchasesSchema = createInsertSchema(compstylePurchases).omit({
  id: true,
  uploadedAt: true,
});

// CompStyle Types
export type CompstyleLocation = typeof compstyleLocations.$inferSelect;
export type InsertCompstyleLocation = z.infer<typeof insertCompstyleLocationSchema>;
export type CompstyleStock = typeof compstyleStock.$inferSelect;
export type InsertCompstyleStock = z.infer<typeof insertCompstyleStockSchema>;
export type CompstyleLocationStock = typeof compstyleLocationStock.$inferSelect;
export type InsertCompstyleLocationStock = z.infer<typeof insertCompstyleLocationStockSchema>;
export type CompstyleSales = typeof compstyleSales.$inferSelect;
export type InsertCompstyleSales = z.infer<typeof insertCompstyleSalesSchema>;
export type CompstyleTransit = typeof compstyleTransit.$inferSelect;
export type InsertCompstyleTransit = z.infer<typeof insertCompstyleTransitSchema>;
export type CompstylePurchases = typeof compstylePurchases.$inferSelect;
export type InsertCompstylePurchases = z.infer<typeof insertCompstylePurchasesSchema>;

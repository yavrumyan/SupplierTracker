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

// Total Stock Current - Master inventory with all pricing
export const compstyleTotalStock = pgTable("compstyle_total_stock", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull(), // Column B (Марка)
  sku: text("sku").notNull().unique(), // Column J (КодТовара) - Unique internal SKU
  qtyInStock: integer("qty_in_stock").notNull(), // Column C (НаСкладе)
  retailPriceUsd: decimal("retail_price_usd", { precision: 10, scale: 2 }), // Column D (Цена)
  retailPriceAmd: decimal("retail_price_amd", { precision: 10, scale: 2 }), // Column E (ЦенаПрайса)
  wholesalePrice1: decimal("wholesale_price1", { precision: 10, scale: 2 }), // Column F (Диллерская цена1) - qty < 5
  wholesalePrice2: decimal("wholesale_price2", { precision: 10, scale: 2 }), // Column G (Диллерская цена2) - qty >= 5
  currentCost: decimal("current_cost", { precision: 10, scale: 2 }), // Column H (ЦенаНаНас)
});

// Kievyan 11 Retail Stock
export const compstyleKievyanStock = pgTable("compstyle_kievyan_stock", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull().unique(), // Column A (КодТовара)
  qty: integer("qty").notNull(), // Column B (Остаток)
  retailPriceAmd: decimal("retail_price_amd", { precision: 10, scale: 2 }), // Column C (БухЦена)
});

// Sevan 5 Warehouse Stock
export const compstyleSevanStock = pgTable("compstyle_sevan_stock", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull().unique(), // Column A (КодТовара)
  qty: integer("qty").notNull(), // Column B (Остаток)
  retailPriceAmd: decimal("retail_price_amd", { precision: 10, scale: 2 }), // Column C (БухЦена)
});

// In Transit - Goods coming to locations
export const compstyleTransit = pgTable("compstyle_transit", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull().unique(), // Column A (Товар)
  qty: integer("qty").notNull(), // Column B (Кол.)
  purchasePriceUsd: decimal("purchase_price_usd", { precision: 10, scale: 2 }), // Column C (Цена $)
  purchasePriceAmd: decimal("purchase_price_amd", { precision: 10, scale: 2 }), // Column D (Цена AMD)
  currentCost: decimal("current_cost", { precision: 10, scale: 2 }), // Column G (Уч. цена)
  purchaseOrderNumber: text("purchase_order_number"), // Column J (Связь)
  destinationLocation: text("destination_location"), // Column O (Склад)
  supplier: text("supplier"), // Column P (Поставщик)
});

// Sales Orders by Location
export const compstyleSalesOrders = pgTable("compstyle_sales_orders", {
  id: serial("id").primaryKey(),
  salesOrderNumber: text("sales_order_number").notNull().unique(), // Column A (Поле4)
  orderDate: timestamp("order_date"), // Column B (ДатаИсполнения)
  customer: text("customer"), // Column C (Клиент)
  contactName: text("contact_name"), // Column D (Через)
  location: text("location").notNull(), // "Kievyan" or "Sevan"
  totalAmountUsd: decimal("total_amount_usd", { precision: 12, scale: 2 }), // Column O
});

// Sales Order Line Items
export const compstyleSalesItems = pgTable("compstyle_sales_items", {
  id: serial("id").primaryKey(),
  salesOrderId: integer("sales_order_id").references(() => compstyleSalesOrders.id),
  productName: varchar("product_name", { length: 200 }).notNull(), // Column K (КодТовара)
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }), // Column L (Цена)
  qty: integer("qty").notNull(), // Column M (Количество)
  sumUsd: decimal("sum_usd", { precision: 12, scale: 2 }), // Column N (Поле66)
});

// Purchase Orders by Location
export const compstylePurchaseOrders = pgTable("compstyle_purchase_orders", {
  id: serial("id").primaryKey(),
  purchaseOrderNumber: text("purchase_order_number").notNull().unique(), // Column A (Поле4)
  orderDate: timestamp("order_date"), // Column B (ДатаИсполнения)
  supplier: text("supplier"), // Column C (Клиент)
  contactName: text("contact_name"), // Column D (Через)
  location: text("location").notNull(), // "Kievyan" or "Sevan"
  totalAmountUsd: decimal("total_amount_usd", { precision: 12, scale: 2 }), // Column O
});

// Purchase Order Line Items
export const compstylePurchaseItems = pgTable("compstyle_purchase_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => compstylePurchaseOrders.id),
  productName: varchar("product_name", { length: 200 }).notNull(), // Column K (КодТовара)
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }), // Column L (Цена)
  qty: integer("qty").notNull(), // Column M (Количество)
  sumUsd: decimal("sum_usd", { precision: 12, scale: 2 }), // Column N (Поле66)
});

// Total Sales by Goods - Aggregated sales data
export const compstyleTotalSales = pgTable("compstyle_total_sales", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull().unique(), // Column B (КодТовара)
  qtySold: integer("qty_sold").notNull(), // Column E (Количество)
  salePriceUsd: decimal("sale_price_usd", { precision: 10, scale: 2 }), // Column F (Цена)
  costPriceUsd: decimal("cost_price_usd", { precision: 10, scale: 2 }), // Column G (Учетная цена)
  profitPerUnit: decimal("profit_per_unit", { precision: 10, scale: 2 }), // Calculated: Column F - Column G
  totalProfit: decimal("total_profit", { precision: 12, scale: 2 }), // Calculated: (Column F - Column G) * Column E
});

// Total Procurement by Goods - Aggregated purchase data
export const compstyleTotalProcurement = pgTable("compstyle_total_procurement", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull().unique(), // Column B (КодТовара)
  qtyPurchased: integer("qty_purchased").notNull(), // Column E (Количество)
  purchasePriceUsd: decimal("purchase_price_usd", { precision: 10, scale: 2 }), // Column F (Цена)
});

// Product List - Master product catalog with aggregated data
export const compstyleProductList = pgTable("compstyle_product_list", {
  id: serial("id").primaryKey(),
  sku: text("sku"), // From Total Stock "КодТовара"
  productName: varchar("product_name", { length: 200 }).notNull().unique(), // Unique product names
  stock: integer("stock").default(0), // From Total Stock "НаСкладе"
  transit: integer("transit").default(0), // From In Transit "Кол." (summed)
  retailPriceUsd: decimal("retail_price_usd", { precision: 10, scale: 2 }), // From Total Stock "Цена"
  retailPriceAmd: decimal("retail_price_amd", { precision: 10, scale: 2 }), // From Total Stock "ЦенаПрайса"
  dealerPrice1: decimal("dealer_price_1", { precision: 10, scale: 2 }), // From Total Stock "Диллерская цена1"
  dealerPrice2: decimal("dealer_price_2", { precision: 10, scale: 2 }), // From Total Stock "Диллерская цена2"
  cost: decimal("cost", { precision: 10, scale: 2 }), // From Total Stock "ЦенаНаНас"
  latestPurchase: decimal("latest_purchase", { precision: 10, scale: 2 }), // From In Transit "Цена $" or latest Purchase
  latestCost: decimal("latest_cost", { precision: 10, scale: 2 }), // From Total Sales "Учетная цена"
  aveSalesPrice: decimal("ave_sales_price", { precision: 10, scale: 2 }), // From Total Sales "Цена"
  actualPrice: decimal("actual_price", { precision: 10, scale: 2 }), // Manual input
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }), // Auto-calculated
  supplier: text("supplier"), // Dropdown selection
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// CompStyle Relations


// CompStyle Zod schemas
export const insertCompstyleLocationSchema = createInsertSchema(compstyleLocations).omit({
  id: true,
  createdAt: true,
});

export const insertCompstyleTotalStockSchema = createInsertSchema(compstyleTotalStock).omit({
  id: true,
});

export const insertCompstyleKievyanStockSchema = createInsertSchema(compstyleKievyanStock).omit({
  id: true,
});

export const insertCompstyleSevanStockSchema = createInsertSchema(compstyleSevanStock).omit({
  id: true,
});

export const insertCompstyleTransitSchema = createInsertSchema(compstyleTransit).omit({
  id: true,
});

export const insertCompstyleSalesOrderSchema = createInsertSchema(compstyleSalesOrders).omit({
  id: true,
});

export const insertCompstyleSalesItemSchema = createInsertSchema(compstyleSalesItems).omit({
  id: true,
});

export const insertCompstylePurchaseOrderSchema = createInsertSchema(compstylePurchaseOrders).omit({
  id: true,
});

export const insertCompstylePurchaseItemSchema = createInsertSchema(compstylePurchaseItems).omit({
  id: true,
});

export const insertCompstyleTotalSalesSchema = createInsertSchema(compstyleTotalSales).omit({
  id: true,
});

export const insertCompstyleTotalProcurementSchema = createInsertSchema(compstyleTotalProcurement).omit({
  id: true,
});

export const insertCompstyleProductListSchema = createInsertSchema(compstyleProductList).omit({
  id: true,
  lastUpdated: true,
});

// CompStyle Types
export type CompstyleLocation = typeof compstyleLocations.$inferSelect;
export type InsertCompstyleLocation = z.infer<typeof insertCompstyleLocationSchema>;
export type CompstyleTotalStock = typeof compstyleTotalStock.$inferSelect;
export type InsertCompstyleTotalStock = z.infer<typeof insertCompstyleTotalStockSchema>;
export type CompstyleKievyanStock = typeof compstyleKievyanStock.$inferSelect;
export type InsertCompstyleKievyanStock = z.infer<typeof insertCompstyleKievyanStockSchema>;
export type CompstyleSevanStock = typeof compstyleSevanStock.$inferSelect;
export type InsertCompstyleSevanStock = z.infer<typeof insertCompstyleSevanStockSchema>;
export type CompstyleTransit = typeof compstyleTransit.$inferSelect;
export type InsertCompstyleTransit = z.infer<typeof insertCompstyleTransitSchema>;
export type CompstyleSalesOrder = typeof compstyleSalesOrders.$inferSelect;
export type InsertCompstyleSalesOrder = z.infer<typeof insertCompstyleSalesOrderSchema>;
export type CompstyleSalesItem = typeof compstyleSalesItems.$inferSelect;
export type InsertCompstyleSalesItem = z.infer<typeof insertCompstyleSalesItemSchema>;
export type CompstylePurchaseOrder = typeof compstylePurchaseOrders.$inferSelect;
export type InsertCompstylePurchaseOrder = z.infer<typeof insertCompstylePurchaseOrderSchema>;
export type CompstylePurchaseItem = typeof compstylePurchaseItems.$inferSelect;
export type InsertCompstylePurchaseItem = z.infer<typeof insertCompstylePurchaseItemSchema>;
export type CompstyleTotalSales = typeof compstyleTotalSales.$inferSelect;
export type InsertCompstyleTotalSales = z.infer<typeof insertCompstyleTotalSalesSchema>;
export type CompstyleTotalProcurement = typeof compstyleTotalProcurement.$inferSelect;
export type InsertCompstyleTotalProcurement = z.infer<typeof insertCompstyleTotalProcurementSchema>;
export type CompstyleProductList = typeof compstyleProductList.$inferSelect;
export type InsertCompstyleProductList = z.infer<typeof insertCompstyleProductListSchema>;

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

// User table (keeping existing database structure)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  productName: varchar("product_name", { length: 200 }).notNull(), // Column A (КодТовара)
  qty: integer("qty").notNull(), // Column B (Остаток)
  retailPriceAmd: decimal("retail_price_amd", { precision: 10, scale: 2 }), // Column C (БухЦена)
});

// Sevan 5 Warehouse Stock
export const compstyleSevanStock = pgTable("compstyle_sevan_stock", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 200 }).notNull(), // Column A (КодТовара)
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
  orderDate: timestamp("order_date"), // Column Q (Дата заказа)
  expectedArrival: timestamp("expected_arrival"), // Added field for expected arrival date
  status: text("status").default("ordered"), // Ordered, Shipped, At Customs
  priority: text("priority").default("normal"), // Normal, Urgent
  notes: text("notes"), // Additional notes field
  documents: jsonb("documents").$type<Array<{filename: string; originalName: string; filePath: string; uploadedAt: string}>>().default([]), // Attached documents
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
  createdAt: true,
}).extend({
  orderDate: z.union([z.string(), z.date()]).optional().nullable(),
  expectedArrival: z.union([z.string(), z.date()]).optional().nullable(), // Added schema for expectedArrival
  status: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional(),
  documents: z.array(z.object({
    filename: z.string(),
    originalName: z.string(),
    filePath: z.string(),
    uploadedAt: z.string()
  })).optional(),
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

// ==================== CHIP ERP SCHEMA ====================

// Currency exchange rates
export const chipCurrencyRates = pgTable("chip_currency_rates", {
  id: serial("id").primaryKey(),
  currency: text("currency").notNull(), // USD, RUB, EUR
  rateToAMD: decimal("rate_to_amd", { precision: 10, scale: 4 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Products
export const chipProducts = pgTable("chip_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  description: text("description"),
  category: text("category"),
  unit: text("unit"), // Unit of measurement (pcs, box, kg, etc.)
  lowStockAlert: integer("low_stock_alert").default(0), // Alert threshold for low stock
  supplierReference: text("supplier_reference"), // Optional supplier reference
  notes: text("notes"), // Optional notes
  serialNumberTracking: boolean("serial_number_tracking").default(false),
  currentStock: integer("current_stock").default(0),
  averageCost: decimal("average_cost", { precision: 12, scale: 2 }).default("0"), // Weighted average in AMD
  sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }),
  currency: text("currency").default("AMD"), // AMD, USD, RUB, EUR
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers
export const chipCustomers = pgTable("chip_customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxId: text("tax_id"),
  paymentTerms: integer("payment_terms").default(0), // Days
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default("0"), // Credit limit in AMD
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"), // Outstanding balance in AMD
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers (CHIP specific, separate from SupHub)
export const chipSuppliers = pgTable("chip_suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxId: text("tax_id"),
  paymentTerms: integer("payment_terms").default(0), // Days
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"), // Outstanding balance in AMD
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchases from suppliers
export const chipPurchases = pgTable("chip_purchases", {
  id: serial("id").primaryKey(),
  purchaseNumber: text("purchase_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => chipSuppliers.id),
  purchaseDate: timestamp("purchase_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  totalAmountAMD: decimal("total_amount_amd", { precision: 12, scale: 2 }).notNull(), // Converted to AMD
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, partial, paid
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  paymentMethod: text("payment_method"), // cash, card, bank_transfer
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase line items
export const chipPurchaseItems = pgTable("chip_purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => chipPurchases.id).notNull(),
  productId: integer("product_id").references(() => chipProducts.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  unitPriceAMD: decimal("unit_price_amd", { precision: 12, scale: 2 }).notNull(), // Converted to AMD
  serialNumbers: jsonb("serial_numbers").$type<string[]>().default([]),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

// Sales to customers
export const chipSales = pgTable("chip_sales", {
  id: serial("id").primaryKey(),
  saleNumber: text("sale_number").notNull().unique(),
  customerId: integer("customer_id").references(() => chipCustomers.id),
  saleDate: timestamp("sale_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  totalAmountAMD: decimal("total_amount_amd", { precision: 12, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }).default("0"), // 20% Armenian VAT
  totalWithVat: decimal("total_with_vat", { precision: 12, scale: 2 }).notNull(),
  costOfGoods: decimal("cost_of_goods", { precision: 12, scale: 2 }).notNull(), // Total cost in AMD
  profit: decimal("profit", { precision: 12, scale: 2 }).notNull(), // Profit in AMD
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, partial, paid
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  paymentMethod: text("payment_method"), // cash, card, bank_transfer
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales line items
export const chipSalesItems = pgTable("chip_sales_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => chipSales.id).notNull(),
  productId: integer("product_id").references(() => chipProducts.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  unitPriceAMD: decimal("unit_price_amd", { precision: 12, scale: 2 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull(), // Average cost at time of sale
  serialNumbers: jsonb("serial_numbers").$type<string[]>().default([]),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).notNull(),
});

// Invoices
export const chipInvoices = pgTable("chip_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id").references(() => chipCustomers.id).notNull(),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }).notNull(), // 20%
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice line items
export const chipInvoiceItems = pgTable("chip_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => chipInvoices.id).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
});

// Expenses
export const chipExpenses = pgTable("chip_expenses", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  category: text("category").notNull(), // rent, utilities, salaries, supplies, marketing, other
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  amountAMD: decimal("amount_amd", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // cash, card, bank_transfer
  receiptPath: text("receipt_path"),
  isPersonal: boolean("is_personal").default(false), // true for personal expenses
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments (tracks partial payments for sales and purchases)
export const chipPayments = pgTable("chip_payments", {
  id: serial("id").primaryKey(),
  paymentDate: timestamp("payment_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("AMD"),
  amountAMD: decimal("amount_amd", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, bank_transfer
  referenceType: text("reference_type").notNull(), // sale, purchase, invoice
  referenceId: integer("reference_id").notNull(), // ID of sale, purchase, or invoice
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CHIP Insert Schemas with number coercion for form inputs
export const insertChipCurrencyRateSchema = createInsertSchema(chipCurrencyRates).omit({
  id: true,
  lastUpdated: true,
}).extend({
  rateToAMD: z.coerce.number().positive(),
});

export const insertChipProductSchema = createInsertSchema(chipProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currentStock: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : v, z.coerce.number().int().nonnegative().optional()),
  averageCost: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
  sellingPrice: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
  lowStockAlert: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : v, z.coerce.number().int().nonnegative().optional()),
});

export const insertChipCustomerSchema = createInsertSchema(chipCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  creditLimit: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
  currentBalance: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
});

export const insertChipSupplierSchema = createInsertSchema(chipSuppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currentBalance: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
});

export const insertChipPurchaseSchema = createInsertSchema(chipPurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  supplierId: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : v, z.coerce.number().int().optional()),
  totalAmount: z.preprocess(v => String(Number(v)), z.string()),
  totalAmountAMD: z.preprocess(v => String(Number(v)), z.string()),
});

export const insertChipPurchaseItemSchema = createInsertSchema(chipPurchaseItems).omit({
  id: true,
}).extend({
  purchaseId: z.coerce.number().int(),
  productId: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.preprocess(v => String(Number(v)), z.string()),
  unitPriceAMD: z.preprocess(v => String(Number(v)), z.string()),
  totalPrice: z.preprocess(v => String(Number(v)), z.string()),
});

export const insertChipSaleSchema = createInsertSchema(chipSales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  customerId: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : v, z.coerce.number().int().optional()),
  totalAmount: z.preprocess(v => String(Number(v)), z.string()),
  totalAmountAMD: z.preprocess(v => String(Number(v)), z.string()),
  costOfGoods: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
  profit: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
});

export const insertChipSaleItemSchema = createInsertSchema(chipSalesItems).omit({
  id: true,
}).extend({
  saleId: z.coerce.number().int(),
  productId: z.coerce.number().int(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.preprocess(v => String(Number(v)), z.string()),
  unitPriceAMD: z.preprocess(v => String(Number(v)), z.string()),
  unitCost: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
  totalPrice: z.preprocess(v => String(Number(v)), z.string()),
  totalCost: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
  profit: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : String(Number(v)), z.string().optional()),
});

export const insertChipInvoiceSchema = createInsertSchema(chipInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  customerId: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : v, z.coerce.number().int().optional()),
  subtotal: z.preprocess(v => String(Number(v)), z.string()),
  subtotalAMD: z.preprocess(v => String(Number(v)), z.string()),
  vatAmount: z.preprocess(v => String(Number(v)), z.string()),
  vatAmountAMD: z.preprocess(v => String(Number(v)), z.string()),
  totalAmount: z.preprocess(v => String(Number(v)), z.string()),
  totalAmountAMD: z.preprocess(v => String(Number(v)), z.string()),
});

export const insertChipInvoiceItemSchema = createInsertSchema(chipInvoiceItems).omit({
  id: true,
}).extend({
  invoiceId: z.coerce.number().int(),
  productId: z.preprocess(v => v === "" || v === null || v === undefined ? undefined : v, z.coerce.number().int().optional()),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.preprocess(v => String(Number(v)), z.string()),
  totalPrice: z.preprocess(v => String(Number(v)), z.string()),
});

export const insertChipExpenseSchema = createInsertSchema(chipExpenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.preprocess(v => String(Number(v)), z.string()),
  amountAMD: z.preprocess(v => String(Number(v)), z.string()),
});

export const insertChipPaymentSchema = createInsertSchema(chipPayments).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.preprocess(v => String(Number(v)), z.string()),
  amountAMD: z.preprocess(v => String(Number(v)), z.string()),
  referenceId: z.coerce.number().int(),
});

// CHIP Types
export type ChipCurrencyRate = typeof chipCurrencyRates.$inferSelect;
export type InsertChipCurrencyRate = z.infer<typeof insertChipCurrencyRateSchema>;
export type ChipProduct = typeof chipProducts.$inferSelect;
export type InsertChipProduct = z.infer<typeof insertChipProductSchema>;
export type ChipCustomer = typeof chipCustomers.$inferSelect;
export type InsertChipCustomer = z.infer<typeof insertChipCustomerSchema>;
export type ChipSupplier = typeof chipSuppliers.$inferSelect;
export type InsertChipSupplier = z.infer<typeof insertChipSupplierSchema>;
export type ChipPurchase = typeof chipPurchases.$inferSelect;
export type InsertChipPurchase = z.infer<typeof insertChipPurchaseSchema>;
export type ChipPurchaseItem = typeof chipPurchaseItems.$inferSelect;
export type InsertChipPurchaseItem = z.infer<typeof insertChipPurchaseItemSchema>;
export type ChipSale = typeof chipSales.$inferSelect;
export type InsertChipSale = z.infer<typeof insertChipSaleSchema>;
export type ChipSalesItem = typeof chipSalesItems.$inferSelect;
export type InsertChipSaleItem = z.infer<typeof insertChipSaleItemSchema>;
export type ChipInvoice = typeof chipInvoices.$inferSelect;
export type InsertChipInvoice = z.infer<typeof insertChipInvoiceSchema>;
export type ChipInvoiceItem = typeof chipInvoiceItems.$inferSelect;
export type InsertChipInvoiceItem = z.infer<typeof insertChipInvoiceItemSchema>;
export type ChipExpense = typeof chipExpenses.$inferSelect;
export type InsertChipExpense = z.infer<typeof insertChipExpenseSchema>;
export type ChipPayment = typeof chipPayments.$inferSelect;
export type InsertChipPayment = z.infer<typeof insertChipPaymentSchema>;
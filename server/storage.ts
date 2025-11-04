import {
  suppliers,
  priceListFiles,
  priceListItems,
  offers,
  orders,
  orderItems,
  costCalculationFiles,
  inquiries,
  searchIndex,
  documents,
  users,
  compstyleLocations,
  compstyleTotalStock,
  compstyleKievyanStock,
  compstyleSevanStock,
  compstyleTransit,
  compstyleSalesOrders,
  compstyleSalesItems,
  compstylePurchaseOrders,
  compstylePurchaseItems,
  compstyleTotalSales,
  compstyleTotalProcurement,
  compstyleProductList,
  type Supplier,
  type InsertSupplier,
  type PriceListFile,
  type InsertPriceListFile,
  type PriceListItem,
  type InsertPriceListItem,
  type Offer,
  type InsertOffer,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CostCalculationFile,
  type Inquiry,
  type InsertInquiry,
  type SearchIndex,
  type InsertSearchIndex,
  type Document,
  type InsertDocument,
  type User,
  type InsertUser,
  type CompstyleLocation,
  type InsertCompstyleLocation,
  type CompstyleTotalStock,
  type InsertCompstyleTotalStock,
  type CompstyleKievyanStock,
  type InsertCompstyleKievyanStock,
  type CompstyleSevanStock,
  type InsertCompstyleSevanStock,
  type CompstyleTransit,
  type InsertCompstyleTransit,
  type CompstyleSalesOrder,
  type InsertCompstyleSalesOrder,
  type CompstyleSalesItem,
  type InsertCompstyleSalesItem,
  type CompstylePurchaseOrder,
  type InsertCompstylePurchaseOrder,
  type CompstylePurchaseItem,
  type InsertCompstylePurchaseItem,
  type CompstyleTotalSales,
  type InsertCompstyleTotalSales,
  type CompstyleTotalProcurement,
  type InsertCompstyleTotalProcurement,
  type CompstyleProductList,
  type InsertCompstyleProductList,
  chipCurrencyRates,
  chipProducts,
  chipCustomers,
  chipSuppliers,
  chipPurchases,
  chipPurchaseItems,
  chipSales,
  chipSalesItems,
  chipInvoices,
  chipInvoiceItems,
  chipExpenses,
  chipPayments,
  type ChipCurrencyRate,
  type InsertChipCurrencyRate,
  type ChipProduct,
  type InsertChipProduct,
  type ChipCustomer,
  type InsertChipCustomer,
  type ChipSupplier,
  type InsertChipSupplier,
  type ChipPurchase,
  type InsertChipPurchase,
  type ChipPurchaseItem,
  type InsertChipPurchaseItem,
  type ChipSale,
  type InsertChipSale,
  type ChipSalesItem,
  type InsertChipSaleItem,
  type ChipInvoice,
  type InsertChipInvoice,
  type ChipInvoiceItem,
  type InsertChipInvoiceItem,
  type ChipExpense,
  type InsertChipExpense,
  type ChipPayment,
  type InsertChipPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Supplier methods
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSupplierByName(name: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;
  searchSuppliers(query: string, filters: {
    country?: string;
    category?: string;
    brand?: string;
    minReputation?: number;
    workingStyle?: string;
  }): Promise<Supplier[]>;
  getAllSuppliers(): Promise<Supplier[]>;

  // Price list methods
  createPriceListFile(priceListFile: InsertPriceListFile): Promise<PriceListFile>;
  getPriceListFiles(supplierId: number): Promise<PriceListFile[]>;
  createPriceListItem(item: InsertPriceListItem): Promise<PriceListItem>;
  getPriceListItems(supplierId: number): Promise<PriceListItem[]>;
  deletePriceListFile(id: number): Promise<void>;

  // Offer methods
  createOffer(offer: InsertOffer): Promise<Offer>;
  getOffers(supplierId: number): Promise<Offer[]>;
  getOffer(id: number): Promise<Offer | undefined>;
  updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer>;
  deleteOffer(id: number): Promise<void>;

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(supplierId: number): Promise<Order[]>;
  getOrderWithItems(orderId: number): Promise<Order & { items: OrderItem[] }>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, item: Partial<InsertOrderItem>): Promise<OrderItem>;
  deleteOrderItem(id: number): Promise<void>;

  // Cost calculation methods
  createCostCalculationFile(file: Omit<CostCalculationFile, 'id' | 'uploadedAt'>): Promise<CostCalculationFile>;
  getCostCalculationFile(supplierId: number): Promise<CostCalculationFile | undefined>;

  // Inquiry methods
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiries(): Promise<Inquiry[]>;

  // Search index methods
  createSearchIndexEntry(entry: InsertSearchIndex): Promise<SearchIndex>;
  createSearchIndexEntries(entries: InsertSearchIndex[]): Promise<SearchIndex[]>;
  deleteSearchIndexBySource(sourceType: string, sourceId: number): Promise<void>;
  searchProducts(query: string, filters: {
    supplier?: string;
    country?: string;
    category?: string;
    brand?: string;
    sourceType?: string;
  }): Promise<SearchIndex[]>;

  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocuments(supplierId: number): Promise<Document[]>;
  deleteDocument(id: number): Promise<void>;

  // Categories and brands methods
  getAllCategoriesFromSuppliers(): Promise<string[]>;
  getAllBrandsFromSuppliers(): Promise<string[]>;
  deleteCategoryFromAllSuppliers(categoryName: string): Promise<void>;
  deleteBrandFromAllSuppliers(brandName: string): Promise<void>;

  // Export methods
  getAllSuppliersForExport(): Promise<Supplier[]>;
  getAllDocumentsForExport(): Promise<(Document & { supplierName: string })[]>;
  getCompstyleProductListPaginated(limit: number, offset: number): Promise<CompstyleProductList[]>;

  // Import methods
  importSuppliers(suppliers: InsertSupplier[]): Promise<{imported: number, skipped: number, errors: string[]}>;

  // CompStyle methods
  createCompstyleLocation(location: InsertCompstyleLocation): Promise<CompstyleLocation>;
  getCompstyleLocations(): Promise<CompstyleLocation[]>;
  createCompstyleTotalStock(stock: InsertCompstyleTotalStock): Promise<CompstyleTotalStock>;
  createCompstyleKievyanStock(stock: InsertCompstyleKievyanStock): Promise<CompstyleKievyanStock>;
  createCompstyleSevanStock(stock: InsertCompstyleSevanStock): Promise<CompstyleSevanStock>;
  createCompstyleTransit(transit: InsertCompstyleTransit): Promise<CompstyleTransit>;
  createCompstyleSalesOrder(order: InsertCompstyleSalesOrder): Promise<CompstyleSalesOrder>;
  createCompstyleSalesItem(item: InsertCompstyleSalesItem): Promise<CompstyleSalesItem>;
  createCompstylePurchaseOrder(order: InsertCompstylePurchaseOrder): Promise<CompstylePurchaseOrder>;
  createCompstylePurchaseItem(item: InsertCompstylePurchaseItem): Promise<CompstylePurchaseItem>;
  createCompstyleTotalSales(sales: InsertCompstyleTotalSales): Promise<CompstyleTotalSales>;
  createCompstyleTotalProcurement(procurement: InsertCompstyleTotalProcurement): Promise<CompstyleTotalProcurement>;
  getCompstyleDashboardStats(): Promise<{
    productsToOrder: number;
    deadProducts: number;
    lockedMoney: number;
    salesVolume30Days: number;
  }>;
  getCompstyleDataOverview(): Promise<{
    files: Array<{
      name: string;
      type: string;
      records: number;
      status: string;
    }>;
    totals: {
      totalFiles: number;
      totalRecords: number;
      lastUpdated: string;
    };
  }>;
  getCompstyleTotalStock(): Promise<CompstyleTotalStock[]>;
  getCompstyleKievyanStock(): Promise<CompstyleKievyanStock[]>;
  getCompstyleSevanStock(): Promise<CompstyleSevanStock[]>;
  getCompstyleTransit(): Promise<CompstyleTransit[]>;
  getCompstyleSalesOrders(): Promise<CompstyleSalesOrder[]>;
  getCompstyleSalesItems(): Promise<CompstyleSalesItem[]>;
  getCompstylePurchaseOrders(): Promise<CompstylePurchaseOrder[]>;
  getCompstylePurchaseItems(): Promise<CompstylePurchaseItem[]>;
  getCompstyleTotalSales(): Promise<CompstyleTotalSales[]>;
  getCompstyleTotalProcurement(): Promise<CompstyleTotalProcurement[]>;

  // Product List methods
  getCompstyleProductList(): Promise<CompstyleProductList[]>;
  getCompstyleProductListPaginated(limit: number, offset: number): Promise<CompstyleProductList[]>;
  createCompstyleProductList(product: InsertCompstyleProductList): Promise<CompstyleProductList>;
  updateCompstyleProductList(id: number, product: Partial<InsertCompstyleProductList>): Promise<CompstyleProductList>;
  upsertCompstyleProductList(product: InsertCompstyleProductList): Promise<CompstyleProductList>;
  rebuildProductList(): Promise<number>;

  // Phase 1 Analytics methods
  getCompstyleSalesVelocity(): Promise<Array<{
    productName: string;
    qtySold: number;
    salesPeriodDays: number;
    dailyVelocity: number;
    weeklyVelocity: number;
    monthlyVelocity: number;
  }>>;
  getCompstyleStockOutRisk(): Promise<Array<{
    productName: string;
    currentStock: number;
    inTransit: number;
    totalAvailable: number;
    dailyVelocity: number;
    daysUntilStockOut: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    recommendedOrder: number;
  }>>;
  getCompstyleDeadStock(): Promise<Array<{
    productName: string;
    currentStock: number;
    inTransit: number;
    totalInventory: number;
    qtySoldLast30Days: number;
    qtySoldLast60Days: number;
    qtySoldLast90Days: number;
    daysOfInventory: number | string;
    lockedValue: number;
    recommendation: string;
  }>>;
  // Profitability Heat Map
  getProfitabilityHeatMap(): Promise<Array<{
    productName: string;
    retailPriceUsd: number;
    cost: number;
    profitPerUnit: number;
    profitMargin: number;
    qtySold: number;
    totalProfit: number;
    totalStock: number;
    potentialProfit: number;
    marginLevel: 'excellent' | 'good' | 'low' | 'negative';
    urgentRefill: boolean;
    daysUntilStockOut: number;
  }>>;

  // Phase 2: Strategic Insights
  // Supplier Performance Matrix
  getSupplierPerformanceMatrix(): Promise<Array<{
    supplier: string;
    totalPurchases: number;
    avgPurchasePrice: number;
    priceCompetitiveness: number;
    avgLeadTimeDays: number;
    productsSupplied: number;
    performanceScore: number;
  }>>;

  // Location Optimization
  getLocationOptimization(): Promise<{
    kievyan: {
      totalSales: number;
      totalRevenue: number;
      avgOrderValue: number;
      topProducts: Array<{productName: string; qty: number; revenue: number}>;
    };
    sevan: {
      totalSales: number;
      totalRevenue: number;
      avgOrderValue: number;
      topProducts: Array<{productName: string; qty: number; revenue: number}>;
    };
    transferRecommendations: Array<{
      productName: string;
      fromLocation: string;
      toLocation: string;
      qty: number;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }>;

  // Order Recommendations Engine
  getOrderRecommendationsEngine(): Promise<Array<{
    productName: string;
    optimalOrderQty: number;
    suggestedSupplier: string;
    supplierPrice: number;
    expectedProfit: number;
    profitMargin: number;
    stockOutRisk: number;
    priorityScore: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>>;

  // ==================== CHIP ERP METHODS ====================

  // Currency methods
  getChipCurrencyRates(): Promise<ChipCurrencyRate[]>;
  updateChipCurrencyRate(currency: string, rateToAMD: string): Promise<ChipCurrencyRate>;
  convertToAMD(amount: number, fromCurrency: string): Promise<number>;

  // Product methods
  getChipProducts(): Promise<ChipProduct[]>;
  getChipProduct(id: number): Promise<ChipProduct | undefined>;
  createChipProduct(product: InsertChipProduct): Promise<ChipProduct>;
  updateChipProduct(id: number, product: Partial<InsertChipProduct>): Promise<ChipProduct>;
  deleteChipProduct(id: number): Promise<void>;
  updateChipProductStock(id: number, stockChange: number, newAverageCost?: string): Promise<ChipProduct>;

  // Customer methods
  getChipCustomers(): Promise<ChipCustomer[]>;
  getChipCustomer(id: number): Promise<ChipCustomer | undefined>;
  createChipCustomer(customer: InsertChipCustomer): Promise<ChipCustomer>;
  updateChipCustomer(id: number, customer: Partial<InsertChipCustomer>): Promise<ChipCustomer>;
  deleteChipCustomer(id: number): Promise<void>;

  // Supplier methods
  getChipSuppliers(): Promise<ChipSupplier[]>;
  getChipSupplier(id: number): Promise<ChipSupplier | undefined>;
  createChipSupplier(supplier: InsertChipSupplier): Promise<ChipSupplier>;
  updateChipSupplier(id: number, supplier: Partial<InsertChipSupplier>): Promise<ChipSupplier>;
  deleteChipSupplier(id: number): Promise<void>;

  // Purchase methods
  getChipPurchases(): Promise<ChipPurchase[]>;
  getChipPurchase(id: number): Promise<ChipPurchase | undefined>;
  getChipPurchaseWithItems(id: number): Promise<ChipPurchase & { items: ChipPurchaseItem[], supplier?: ChipSupplier }>;
  createChipPurchase(purchase: InsertChipPurchase, items: InsertChipPurchaseItem[]): Promise<ChipPurchase>;
  updateChipPurchase(id: number, purchase: Partial<InsertChipPurchase>): Promise<ChipPurchase>;
  deleteChipPurchase(id: number): Promise<void>;

  // Sale methods
  getChipSales(): Promise<ChipSale[]>;
  getChipSale(id: number): Promise<ChipSale | undefined>;
  getChipSaleWithItems(id: number): Promise<ChipSale & { items: ChipSalesItem[], customer?: ChipCustomer }>;
  createChipSale(sale: InsertChipSale, items: InsertChipSaleItem[]): Promise<ChipSale>;
  updateChipSale(id: number, sale: Partial<InsertChipSale>): Promise<ChipSale>;
  deleteChipSale(id: number): Promise<void>;

  // Invoice methods
  getChipInvoices(): Promise<ChipInvoice[]>;
  getChipInvoice(id: number): Promise<ChipInvoice | undefined>;
  getChipInvoiceWithItems(id: number): Promise<ChipInvoice & { items: ChipInvoiceItem[], customer?: ChipCustomer }>;
  createChipInvoice(invoice: InsertChipInvoice, items: InsertChipInvoiceItem[]): Promise<ChipInvoice>;
  updateChipInvoice(id: number, invoice: Partial<InsertChipInvoice>): Promise<ChipInvoice>;
  deleteChipInvoice(id: number): Promise<void>;

  // Expense methods
  getChipExpenses(): Promise<ChipExpense[]>;
  getChipExpense(id: number): Promise<ChipExpense | undefined>;
  createChipExpense(expense: InsertChipExpense): Promise<ChipExpense>;
  updateChipExpense(id: number, expense: Partial<InsertChipExpense>): Promise<ChipExpense>;
  deleteChipExpense(id: number): Promise<void>;

  // Payment methods
  getChipPayments(): Promise<ChipPayment[]>;
  createChipPayment(payment: InsertChipPayment): Promise<ChipPayment>;

  // Dashboard & Analytics
  getChipDashboardStats(): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalExpenses: number;
    netIncome: number;
    inventoryValue: number;
    accountsReceivable: number;
    accountsPayable: number;
    salesCount: number;
    purchaseCount: number;
  }>;

  getChipProfitLoss(startDate: Date, endDate: Date): Promise<{
    revenue: number;
    costOfGoods: number;
    grossProfit: number;
    expenses: { category: string; amount: number }[];
    totalExpenses: number;
    netIncome: number;
  }>;

  getChipCashFlow(startDate: Date, endDate: Date): Promise<{
    salesRevenue: number;
    purchaseCosts: number;
    expenses: number;
    netCashFlow: number;
    paymentsByMethod: { method: string; amount: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Supplier methods
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSupplierByName(name: string): Promise<Supplier | undefined> {
    try {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.name, name));
      return supplier || undefined;
    } catch (error) {
      console.log('Drizzle query failed, using direct SQL:', error);
      // Fallback to direct SQL if Drizzle fails
      const result = await db.execute(sql`SELECT * FROM suppliers WHERE name = ${name} LIMIT 1`);
      return result.rows[0] as Supplier || undefined;
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async searchSuppliers(query: string, filters: {
    country?: string;
    category?: string;
    brand?: string;
    minReputation?: number;
    workingStyle?: string;
  }): Promise<Supplier[]> {
    let whereConditions = [];

    if (query) {
      whereConditions.push(
        or(
          ilike(suppliers.name, `%${query}%`),
          ilike(suppliers.comments, `%${query}%`)
        )
      );
    }

    if (filters.country) {
      whereConditions.push(eq(suppliers.country, filters.country));
    }

    if (filters.category) {
      whereConditions.push(sql`${suppliers.categories} @> ${JSON.stringify([filters.category])}`);
    }

    if (filters.brand) {
      whereConditions.push(sql`${suppliers.brands} @> ${JSON.stringify([filters.brand])}`);
    }

    if (filters.minReputation) {
      whereConditions.push(sql`${suppliers.reputation} >= ${filters.minReputation}`);
    }

    if (filters.workingStyle) {
      whereConditions.push(sql`${suppliers.workingStyle} @> ${JSON.stringify([filters.workingStyle])}`);
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    return await db.select().from(suppliers).where(whereClause).orderBy(suppliers.name);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  // Price list methods
  async createPriceListFile(priceListFile: InsertPriceListFile): Promise<PriceListFile> {
    const [newFile] = await db.insert(priceListFiles).values(priceListFile).returning();
    return newFile;
  }

  async getPriceListFiles(supplierId: number): Promise<PriceListFile[]> {
    return await db.select().from(priceListFiles)
      .where(eq(priceListFiles.supplierId, supplierId))
      .orderBy(desc(priceListFiles.uploadedAt));
  }

  async createPriceListItem(item: InsertPriceListItem): Promise<PriceListItem> {
    const [newItem] = await db.insert(priceListItems).values(item).returning();
    return newItem;
  }

  async getPriceListItems(supplierId: number): Promise<PriceListItem[]> {
    return await db.select().from(priceListItems)
      .where(eq(priceListItems.supplierId, supplierId))
      .orderBy(desc(priceListItems.updatedAt));
  }

  async deletePriceListFile(id: number): Promise<void> {
    await db.delete(priceListFiles).where(eq(priceListFiles.id, id));
  }

  // Offer methods
  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [newOffer] = await db.insert(offers).values(offer).returning();
    return newOffer;
  }

  async getOffers(supplierId: number): Promise<Offer[]> {
    return await db.select().from(offers)
      .where(eq(offers.supplierId, supplierId))
      .orderBy(desc(offers.receivedAt));
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer || undefined;
  }

  async updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer> {
    const [updatedOffer] = await db
      .update(offers)
      .set(offer)
      .where(eq(offers.id, id))
      .returning();
    return updatedOffer;
  }

  async deleteOffer(id: number): Promise<void> {
    await db.delete(offers).where(eq(offers.id, id));
  }

  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrders(supplierId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.supplierId, supplierId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderWithItems(orderId: number): Promise<Order & { items: OrderItem[] }> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return { ...order, items };
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async updateOrderItem(id: number, item: Partial<InsertOrderItem>): Promise<OrderItem> {
    const [updatedItem] = await db
      .update(orderItems)
      .set(item)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteOrderItem(id: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.id, id));
  }

  // Cost calculation methods
  async createCostCalculationFile(file: Omit<CostCalculationFile, 'id' | 'uploadedAt'>): Promise<CostCalculationFile> {
    const [newFile] = await db.insert(costCalculationFiles).values(file).returning();
    return newFile;
  }

  async getCostCalculationFile(supplierId: number): Promise<CostCalculationFile | undefined> {
    const [file] = await db.select().from(costCalculationFiles)
      .where(eq(costCalculationFiles.supplierId, supplierId))
      .orderBy(desc(costCalculationFiles.uploadedAt));
    return file || undefined;
  }

  // Inquiry methods
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.sentAt));
  }

  // Search index methods
  async createSearchIndexEntry(entry: InsertSearchIndex): Promise<SearchIndex> {
    const [newEntry] = await db.insert(searchIndex).values(entry).returning();
    return newEntry;
  }

  async createSearchIndexEntries(entries: InsertSearchIndex[]): Promise<SearchIndex[]> {
    if (entries.length === 0) return [];
    const newEntries = await db.insert(searchIndex).values(entries).returning();
    return newEntries;
  }

  async deleteSearchIndexBySource(sourceType: string, sourceId: number): Promise<void> {
    await db.delete(searchIndex).where(
      and(
        eq(searchIndex.sourceType, sourceType),
        eq(searchIndex.sourceId, sourceId)
      )
    );
  }

  async searchProducts(query: string, filters: {
    supplier?: string;
    country?: string;
    category?: string;
    brand?: string;
    sourceType?: string;
  }): Promise<SearchIndex[]> {
    let whereConditions = [];

    // Triple keyword search with AND logic
    if (query) {
      const keywords = query.split(' ').filter(k => k.trim()).map(k => k.trim().toLowerCase());

      // Each keyword must match at least one of the searchable fields
      for (const keyword of keywords) {
        const searchTerm = `%${keyword}%`;
        whereConditions.push(
          or(
            ilike(searchIndex.productName, searchTerm),
            ilike(searchIndex.model, searchTerm),
            ilike(searchIndex.brand, searchTerm),
            ilike(searchIndex.category, searchTerm),
            ilike(searchIndex.notes, searchTerm)
          )
        );
      }
    }

    // Apply filters
    if (filters.supplier) {
      whereConditions.push(ilike(searchIndex.supplier, `%${filters.supplier}%`));
    }

    if (filters.category) {
      whereConditions.push(ilike(searchIndex.category, `%${filters.category}%`));
    }

    if (filters.brand) {
      whereConditions.push(ilike(searchIndex.brand, `%${filters.brand}%`));
    }

    if (filters.sourceType) {
      whereConditions.push(eq(searchIndex.sourceType, filters.sourceType));
    }

    // Country filter requires joining with suppliers table
    if (filters.country) {
      const results = await db
        .select({
          id: searchIndex.id,
          supplierId: searchIndex.supplierId,
          sourceType: searchIndex.sourceType,
          sourceId: searchIndex.sourceId,
          supplier: searchIndex.supplier,
          category: searchIndex.category,
          brand: searchIndex.brand,
          model: searchIndex.model,
          productName: searchIndex.productName,
          price: searchIndex.price,
          currency: searchIndex.currency,
          stock: searchIndex.stock,
          moq: searchIndex.moq,
          warranty: searchIndex.warranty,
          notes: searchIndex.notes,
          createdAt: searchIndex.createdAt,
          updatedAt: searchIndex.updatedAt,
        })
        .from(searchIndex)
        .innerJoin(suppliers, eq(searchIndex.supplierId, suppliers.id))
        .where(
          and(
            eq(suppliers.country, filters.country),
            ...(whereConditions.length > 0 ? [and(...whereConditions)] : [])
          )
        )
        .orderBy(desc(searchIndex.updatedAt));
      return results;
    }

    // Standard search without country filter
    const queryBuilder = db.select().from(searchIndex);

    if (whereConditions.length > 0) {
      return await queryBuilder
        .where(and(...whereConditions))
        .orderBy(desc(searchIndex.updatedAt));
    }

    return await queryBuilder.orderBy(desc(searchIndex.updatedAt));
  }

  // Document methods
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getDocuments(supplierId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.supplierId, supplierId));
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Categories and brands methods
  async getAllCategoriesFromSuppliers(): Promise<string[]> {
    const suppliersData = await db.select({ categories: suppliers.categories }).from(suppliers);
    const allCategories = new Set<string>();

    suppliersData.forEach(supplier => {
      if (supplier.categories) {
        supplier.categories.forEach(category => allCategories.add(category));
      }
    });

    return Array.from(allCategories).sort();
  }

  async getAllBrandsFromSuppliers(): Promise<string[]> {
    const suppliersData = await db.select({ brands: suppliers.brands }).from(suppliers);
    const allBrands = new Set<string>();

    suppliersData.forEach(supplier => {
      if (supplier.brands) {
        supplier.brands.forEach(brand => allBrands.add(brand));
      }
    });

    return Array.from(allBrands).sort();
  }

  async deleteCategoryFromAllSuppliers(categoryToDelete: string): Promise<void> {
    // Get all suppliers that have this category
    const suppliersWithCategory = await db.select().from(suppliers);

    for (const supplier of suppliersWithCategory) {
      if (supplier.categories && supplier.categories.includes(categoryToDelete)) {
        // Remove the category from the array
        const updatedCategories = supplier.categories.filter(cat => cat !== categoryToDelete);

        // Update the supplier
        await db.update(suppliers)
          .set({
            categories: updatedCategories,
            updatedAt: new Date()
          })
          .where(eq(suppliers.id, supplier.id));
      }
    }
  }

  async deleteBrandFromAllSuppliers(brandToDelete: string): Promise<void> {
    // Get all suppliers that have this brand
    const suppliersWithBrand = await db.select().from(suppliers);

    for (const supplier of suppliersWithBrand) {
      if (supplier.brands && supplier.brands.includes(brandToDelete)) {
        // Remove the brand from the array
        const updatedBrands = supplier.brands.filter(brand => brand !== brandToDelete);

        // Update the supplier
        await db.update(suppliers)
          .set({
            brands: updatedBrands,
            updatedAt: new Date()
          })
          .where(eq(suppliers.id, supplier.id));
      }
    }
  }

  // Export methods
  async getAllSuppliersForExport(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getAllDocumentsForExport(): Promise<(Document & { supplierName: string })[]> {
    const result = await db
      .select({
        id: documents.id,
        supplierId: documents.supplierId,
        filename: documents.filename,
        originalName: documents.originalName,
        filePath: documents.filePath,
        fileSize: documents.fileSize,
        fileType: documents.fileType,
        uploadedAt: documents.uploadedAt,
        supplierName: suppliers.name,
      })
      .from(documents)
      .leftJoin(suppliers, eq(documents.supplierId, suppliers.id))
      .orderBy(suppliers.name, documents.originalName);

    return result.map(row => ({
      ...row,
      supplierName: row.supplierName || 'Unknown Supplier'
    }));
  }

  // Import methods
  async importSuppliers(suppliers: InsertSupplier[]): Promise<{imported: number, skipped: number, errors: string[]}> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    console.log(`Starting import of ${suppliers.length} suppliers`);

    for (const supplierData of suppliers) {
      try {
        console.log(`Processing supplier: ${supplierData.name}`);

        // Check if supplier already exists by name or email
        const existingByName = await this.getSupplierByName(supplierData.name);
        if (existingByName) {
          console.log(`Skipping ${supplierData.name} - already exists by name`);
          skipped++;
          continue;
        }

        if (supplierData.email) {
          try {
            const existingByEmail = await db.select().from(suppliers).where(eq(suppliers.email, supplierData.email));
            if (existingByEmail.length > 0) {
              console.log(`Skipping ${supplierData.name} - already exists by email`);
              skipped++;
              continue;
            }
          } catch (error) {
            console.log('Email check failed, using direct SQL:', error);
            const result = await db.execute(sql`SELECT * FROM suppliers WHERE email = ${supplierData.email} LIMIT 1`);
            if (result.rows.length > 0) {
              console.log(`Skipping ${supplierData.name} - already exists by email (direct SQL)`);
              skipped++;
              continue;
            }
          }
        }

        // Create new supplier (only if it doesn't exist)
        console.log(`Creating new supplier: ${supplierData.name}`);
        await this.createSupplier(supplierData);
        console.log(`Successfully created: ${supplierData.name}`);
        imported++;
      } catch (error) {
        console.error(`Error importing ${supplierData.name}:`, error);
        errors.push(`Failed to import supplier "${supplierData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Import complete: ${imported} imported, ${skipped} skipped, ${errors.length} errors`);
    return { imported, skipped, errors };
  }

  // CompStyle methods
  async createCompstyleLocation(location: InsertCompstyleLocation): Promise<CompstyleLocation> {
    const [newLocation] = await db.insert(compstyleLocations).values(location).returning();
    return newLocation;
  }

  async getCompstyleLocations(): Promise<CompstyleLocation[]> {
    return await db.select().from(compstyleLocations).orderBy(compstyleLocations.name);
  }

  async createCompstyleTotalStock(stock: InsertCompstyleTotalStock): Promise<CompstyleTotalStock> {
    const [newStock] = await db.insert(compstyleTotalStock).values(stock).returning();
    return newStock;
  }

  async createCompstyleKievyanStock(stock: InsertCompstyleKievyanStock): Promise<CompstyleKievyanStock> {
    const [newStock] = await db.insert(compstyleKievyanStock).values(stock).returning();
    return newStock;
  }

  async createCompstyleSevanStock(stock: InsertCompstyleSevanStock): Promise<CompstyleSevanStock> {
    const [newStock] = await db.insert(compstyleSevanStock).values(stock).returning();
    return newStock;
  }

  async createCompstyleTransit(transit: InsertCompstyleTransit): Promise<CompstyleTransit> {
    const [newTransit] = await db.insert(compstyleTransit).values(transit).returning();
    return newTransit;
  }

  async createCompstyleSalesOrder(order: InsertCompstyleSalesOrder): Promise<CompstyleSalesOrder> {
    const [newOrder] = await db.insert(compstyleSalesOrders).values(order).returning();
    return newOrder;
  }

  async createCompstyleSalesItem(item: InsertCompstyleSalesItem): Promise<CompstyleSalesItem> {
    const [newItem] = await db.insert(compstyleSalesItems).values(item).returning();
    return newItem;
  }

  async createCompstylePurchaseOrder(order: InsertCompstylePurchaseOrder): Promise<CompstylePurchaseOrder> {
    const [newOrder] = await db.insert(compstylePurchaseOrders).values(order).returning();
    return newOrder;
  }

  async createCompstylePurchaseItem(item: InsertCompstylePurchaseItem): Promise<CompstylePurchaseItem> {
    const [newItem] = await db.insert(compstylePurchaseItems).values(item).returning();
    return newItem;
  }

  async createCompstyleTotalSales(sales: InsertCompstyleTotalSales): Promise<CompstyleTotalSales> {
    const [newSales] = await db.insert(compstyleTotalSales).values(sales).returning();
    return newSales;
  }

  async createCompstyleTotalProcurement(procurement: InsertCompstyleTotalProcurement): Promise<CompstyleTotalProcurement> {
    const [newProcurement] = await db.insert(compstyleTotalProcurement).values(procurement).returning();
    return newProcurement;
  }

  async getCompstyleDashboardStats(): Promise<{
    totalInventory: number;
    stockHealth: number;
    businessHealthIndex: number;
    salesVolume30Days: number;
  }> {
    try {
      // Calculate Total Inventory (Current Stock Value + Total Transit Value)
      const totalStockData = await db.select().from(compstyleTotalStock);
      const transitData = await db.select().from(compstyleTransit);

      let currentStockValue = 0;
      for (const item of totalStockData) {
        const qty = item.qtyInStock || 0;
        const cost = parseFloat(item.currentCost || '0');
        currentStockValue += qty * cost;
      }

      let totalTransitValue = 0;
      for (const item of transitData) {
        const qty = item.qty || 0;
        // Use Purchase Price USD (the price that was actually paid for transit goods)
        const cost = parseFloat(item.purchasePriceUsd || '0');
        totalTransitValue += qty * cost;
      }

      const totalInventory = currentStockValue + totalTransitValue;

      console.log('Inventory calculation details:', {
        currentStockValue: currentStockValue.toFixed(2),
        totalTransitValue: totalTransitValue.toFixed(2),
        totalInventory: totalInventory.toFixed(2),
        stockItemsCount: totalStockData.length,
        transitItemsCount: transitData.length
      });

      // Get dead stock analysis
      const deadStock = await this.getCompstyleDeadStock();

      // Only count products with ">120d old stock - no sales - clearance" recommendation
      const clearanceProducts = deadStock.filter(item =>
        item.recommendation === '>120d old stock - no sales - clearance'
      );

      // Calculate Locked-in Money (dead stock value)
      const lockedMoney = clearanceProducts.reduce((sum, item) => sum + item.lockedValue, 0);

      // Calculate Stock Health: ((Total Inventory - Locked-in Money) / Total Inventory) × 100%
      const stockHealth = totalInventory > 0
        ? ((totalInventory - lockedMoney) / totalInventory) * 100
        : 100;

      // Get 30-day sales volume based on last recorded transaction date
      // First, find the latest order date
      const latestOrderData = await db.select({
        latestDate: sql<Date>`MAX(${compstyleSalesOrders.orderDate})`
      })
      .from(compstyleSalesOrders);

      const latestOrderDate = latestOrderData[0]?.latestDate;

      let salesVolume30Days = 0;

      if (latestOrderDate) {
        // Calculate 30 days before the last transaction date
        const thirtyDaysAgo = new Date(latestOrderDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Use Drizzle's select statement for better type safety and integration
        const salesData = await db.select({
          totalSales: sql<string>`COALESCE(SUM(CAST(${compstyleSalesItems.sumUsd} AS DECIMAL)), 0)`
        })
        .from(compstyleSalesItems)
        .innerJoin(compstyleSalesOrders, eq(compstyleSalesItems.salesOrderId, compstyleSalesOrders.id))
        .where(sql`${compstyleSalesOrders.orderDate} >= ${thirtyDaysAgo} AND ${compstyleSalesOrders.orderDate} <= ${latestOrderDate}`);

        salesVolume30Days = parseFloat(salesData[0]?.totalSales || '0');
      }

      // Calculate Business Health Index
      // 1. Sales Volume Score (40% weight) - compare current 30d sales to historical average (last 6 months)
      // Calculate sales for each of the 6 historical 30-day periods
      const historicalPeriods = [];
      for (let i = 1; i <= 6; i++) {
        const periodEnd = new Date(latestOrderDate);
        periodEnd.setDate(periodEnd.getDate() - (30 * i));

        const periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() - 30);

        const periodSalesData = await db.select({
          totalSales: sql<string>`COALESCE(SUM(CAST(${compstyleSalesItems.sumUsd} AS DECIMAL)), 0)`
        })
        .from(compstyleSalesItems)
        .innerJoin(compstyleSalesOrders, eq(compstyleSalesItems.salesOrderId, compstyleSalesOrders.id))
        .where(sql`${compstyleSalesOrders.orderDate} >= ${periodStart} AND ${compstyleSalesOrders.orderDate} <= ${periodEnd}`);

        const periodSales = parseFloat(periodSalesData[0]?.totalSales || '0');
        if (periodSales > 0) {
          historicalPeriods.push(periodSales);
        }
      }

      // Calculate historical average (only if we have data)
      const historicalAverage = historicalPeriods.length > 0
        ? historicalPeriods.reduce((sum, val) => sum + val, 0) / historicalPeriods.length
        : salesVolume30Days; // Fallback to current if no history

      // Sales Volume Score: min(100, (Current / Historical Average) × 100)
      const salesVolumeScore = historicalAverage > 0
        ? Math.min(100, (salesVolume30Days / historicalAverage) * 100)
        : 100;

      // 2. Profitability Score (30% weight) - based on overall profit margin
      // Get profitability data to calculate average margin
      const profitabilityData = await this.getProfitabilityHeatMap();
      let totalRevenue = 0;
      let totalCost = 0;

      for (const item of profitabilityData) {
        const revenue = item.retailPriceUsd * item.qtySold;
        const cost = item.cost * item.qtySold;
        totalRevenue += revenue;
        totalCost += cost;
      }

      const averageMargin = totalRevenue > 0
        ? ((totalRevenue - totalCost) / totalCost) * 100
        : 0;

      // Target margin: 17.5%
      const targetMargin = 17.5;
      const profitabilityScore = Math.min(100, (averageMargin / targetMargin) * 100);

      // 3. Stock Health Score (15% weight) - already calculated above
      const stockHealthScore = stockHealth;

      // 4. Inventory Health Score (15% weight) - optimal inventory = 3x monthly sales
      const optimalInventory = salesVolume30Days * 3; // 90 days of inventory
      let inventoryHealthScore = 100;

      if (optimalInventory > 0) {
        // Score = (Optimal / Actual) × 100, capped at 100
        // If actual = optimal (3x), score = 100%
        // If actual > optimal (overstocked), score decreases
        // If actual < optimal (understocked), score decreases
        const ratio = optimalInventory / totalInventory;

        if (totalInventory > optimalInventory) {
          // Overstocked: penalize excess inventory
          inventoryHealthScore = Math.max(0, ratio * 100);
        } else {
          // Understocked: penalize insufficient inventory
          inventoryHealthScore = Math.max(0, (totalInventory / optimalInventory) * 100);
        }
      }

      // Calculate weighted Business Health Index (updated weights)
      const businessHealthIndex =
        (salesVolumeScore * 0.40) +
        (profitabilityScore * 0.30) +
        (stockHealthScore * 0.15) +
        (inventoryHealthScore * 0.15);

      console.log('Dashboard stats calculated:', {
        totalInventory: Math.round(totalInventory),
        stockHealth: stockHealth.toFixed(1),
        businessHealthIndex: businessHealthIndex.toFixed(1),
        salesVolume30Days: Math.round(salesVolume30Days),
        salesVolumeScore: salesVolumeScore.toFixed(1),
        profitabilityScore: profitabilityScore.toFixed(1),
        inventoryHealthScore: inventoryHealthScore.toFixed(1)
      });

      return {
        totalInventory: Math.round(totalInventory),
        stockHealth: Math.round(stockHealth * 10) / 10, // Round to 1 decimal
        businessHealthIndex: Math.round(businessHealthIndex * 10) / 10, // Round to 1 decimal
        salesVolume30Days: Math.round(salesVolume30Days),
        // Component scores for detailed insight
        salesVolumeScore: Math.round(salesVolumeScore * 10) / 10,
        profitabilityScore: Math.round(profitabilityScore * 10) / 10,
        stockHealthScore: Math.round(stockHealth * 10) / 10,
        inventoryHealthScore: Math.round(inventoryHealthScore * 10) / 10
      };
    } catch (error) {
      console.error('Error in getCompstyleDashboardStats:', error);
      throw error;
    }
  }

  async getCompstyleSalesVelocity(): Promise<Array<{
    productName: string;
    qtySold: number;
    salesPeriodDays: number;
    dailyVelocity: number;
    weeklyVelocity: number;
    monthlyVelocity: number;
  }>> {
    // Get all sales orders and items
    const salesOrders = await db.select().from(compstyleSalesOrders);
    const salesItems = await db.select().from(compstyleSalesItems);

    // Find the latest order date across all sales orders
    let latestOrderDate: Date | null = null;
    for (const order of salesOrders) {
      if (order.orderDate) {
        if (!latestOrderDate || order.orderDate > latestOrderDate) {
          latestOrderDate = order.orderDate;
        }
      }
    }

    // If no orders found, return empty array
    if (!latestOrderDate) {
      return [];
    }

    // Calculate the date 30 days before the latest order date
    const thirtyDaysAgo = new Date(latestOrderDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Create a map of order IDs that fall within the last 30 days
    const recentOrderIds = new Set<number>();
    for (const order of salesOrders) {
      if (order.orderDate && order.orderDate >= thirtyDaysAgo && order.orderDate <= latestOrderDate) {
        recentOrderIds.add(order.id);
      }
    }

    // Aggregate sales by product name from items belonging to recent orders only
    const aggregatedSales = new Map<string, number>();

    for (const item of salesItems) {
      // Only include items from orders within the last 30 days
      if (item.salesOrderId && recentOrderIds.has(item.salesOrderId)) {
        const currentQty = aggregatedSales.get(item.productName) || 0;
        aggregatedSales.set(item.productName, currentQty + item.qty);
      }
    }

    const salesPeriodDays = 30;

    // Convert aggregated data to result format
    const result = Array.from(aggregatedSales.entries()).map(([productName, qtySold]) => {
      const dailyVelocity = qtySold / salesPeriodDays;

      return {
        productName,
        qtySold,
        salesPeriodDays: salesPeriodDays,
        dailyVelocity: Number(dailyVelocity.toFixed(2)),
        weeklyVelocity: Number((dailyVelocity * 7).toFixed(2)),
        monthlyVelocity: Number((dailyVelocity * 30).toFixed(2))
      };
    }).sort((a, b) => b.dailyVelocity - a.dailyVelocity);

    return result;
  }

  async getCompstyleStockOutRisk(): Promise<Array<{
    productName: string;
    currentStock: number;
    inTransit: number;
    totalAvailable: number;
    dailyVelocity: number;
    daysUntilStockOut: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    recommendedOrder: number;
  }>> {
    // Get all products with stock and transit data
    const productList = await db.select().from(compstyleProductList);
    const salesVelocity = await this.getCompstyleSalesVelocity();

    // Create velocity map for quick lookup
    const velocityMap = new Map(
      salesVelocity.map(v => [v.productName, v.dailyVelocity])
    );

    const riskAnalysis = productList
      .map(product => {
        const dailyVelocity = velocityMap.get(product.productName) || 0;
        const currentStock = product.stock || 0;
        const inTransit = product.transit || 0;
        const totalAvailable = currentStock + inTransit;

        // Calculate days until stock out
        const daysUntilStockOut = dailyVelocity > 0
          ? totalAvailable / dailyVelocity
          : 999;

        // Determine risk level
        let riskLevel: 'critical' | 'high' | 'medium' | 'low';
        if (daysUntilStockOut <= 7) riskLevel = 'critical';
        else if (daysUntilStockOut <= 14) riskLevel = 'high';
        else if (daysUntilStockOut <= 30) riskLevel = 'medium';
        else riskLevel = 'low';

        // Calculate recommended order quantity (30 days of stock)
        const recommendedOrder = dailyVelocity > 0
          ? Math.max(0, Math.ceil(dailyVelocity * 30 - totalAvailable))
          : 0;

        return {
          productName: product.productName,
          currentStock,
          inTransit,
          totalAvailable,
          dailyVelocity: Number(dailyVelocity.toFixed(2)),
          daysUntilStockOut: Number(daysUntilStockOut.toFixed(1)),
          riskLevel,
          recommendedOrder
        };
      })
      .filter(item => item.dailyVelocity > 0 && item.riskLevel !== 'low')
      .sort((a, b) => a.daysUntilStockOut - b.daysUntilStockOut);

    return riskAnalysis;
  }

  async getCompstyleDeadStock(): Promise<Array<{
    productName: string;
    currentStock: number;
    inTransit: number;
    totalInventory: number;
    qtySoldLast30Days: number;
    qtySoldLast60Days: number;
    qtySoldLast90Days: number;
    daysOfInventory: number | string;
    lockedValue: number;
    recommendation: string;
  }>> {
    try {
      const productList = await db.select().from(compstyleProductList);
      const salesOrders = await db.select().from(compstyleSalesOrders);
      const salesItems = await db.select().from(compstyleSalesItems);
      const purchaseItems = await db.select().from(compstylePurchaseItems);
      const purchaseOrders = await db.select().from(compstylePurchaseOrders);

      // Find the latest order date across all sales orders
      let latestOrderDate: Date | null = null;
      for (const order of salesOrders) {
        if (order.orderDate) {
          if (!latestOrderDate || order.orderDate > latestOrderDate) {
            latestOrderDate = order.orderDate;
          }
        }
      }

      if (!latestOrderDate) {
        return [];
      }

      // Calculate dates for different periods
      const thirtyDaysAgo = new Date(latestOrderDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sixtyDaysAgo = new Date(latestOrderDate);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const ninetyDaysAgo = new Date(latestOrderDate);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Create maps of order IDs for each period
      const last30DaysOrderIds = new Set<number>();
      const last60DaysOrderIds = new Set<number>();
      const last90DaysOrderIds = new Set<number>();

      for (const order of salesOrders) {
        if (order.orderDate && order.orderDate >= thirtyDaysAgo && order.orderDate <= latestOrderDate) {
          last30DaysOrderIds.add(order.id);
        }
        if (order.orderDate && order.orderDate >= sixtyDaysAgo && order.orderDate <= latestOrderDate) {
          last60DaysOrderIds.add(order.id);
        }
        if (order.orderDate && order.orderDate >= ninetyDaysAgo && order.orderDate <= latestOrderDate) {
          last90DaysOrderIds.add(order.id);
        }
      }

      // Aggregate sales by product for each period
      const sales30DaysMap = new Map<string, number>();
      const sales60DaysMap = new Map<string, number>();
      const sales90DaysMap = new Map<string, number>();

      for (const item of salesItems) {
        if (item.salesOrderId) {
          if (last30DaysOrderIds.has(item.salesOrderId)) {
            const current = sales30DaysMap.get(item.productName) || 0;
            sales30DaysMap.set(item.productName, current + item.qty);
          }
          if (last60DaysOrderIds.has(item.salesOrderId)) {
            const current = sales60DaysMap.get(item.productName) || 0;
            sales60DaysMap.set(item.productName, current + item.qty);
          }
          if (last90DaysOrderIds.has(item.salesOrderId)) {
            const current = sales90DaysMap.get(item.productName) || 0;
            sales90DaysMap.set(item.productName, current + item.qty);
          }
        }
      }

      // Create a map of product names to their latest purchase date
      const purchaseMap = new Map<string, Date>();
      const currentDate = new Date();

      for (const item of purchaseItems) {
        const productName = item.productName;
        for (const order of purchaseOrders) {
          if (order.orderDate) {
            const existingDate = purchaseMap.get(productName);
            if (!existingDate || order.orderDate > existingDate) {
              purchaseMap.set(productName, order.orderDate);
            }
          }
        }
      }

      // Also match similar product names
      for (const product of productList) {
        if (!purchaseMap.has(product.productName)) {
          for (const item of purchaseItems) {
            if (item.productName.trim() === product.productName.trim()) {
              for (const order of purchaseOrders) {
                if (order.orderDate) {
                  const existingDate = purchaseMap.get(product.productName);
                  if (!existingDate || order.orderDate > existingDate) {
                    purchaseMap.set(product.productName, order.orderDate);
                  }
                }
              }
              break;
            }
          }
        }
      }

      const deadStockAnalysis = productList
        .map(product => {
          const qtySold30Days = sales30DaysMap.get(product.productName) || 0;
          const qtySold60Days = sales60DaysMap.get(product.productName) || 0;
          const qtySold90Days = sales90DaysMap.get(product.productName) || 0;
          const currentStock = product.stock || 0;
          const inTransit = 0;
          const totalInventory = currentStock;

          // Calculate days of stock based on purchase date age
          let daysOfInventory: number | string = 'Long time ago';
          const latestPurchaseDate = purchaseMap.get(product.productName);

          if (latestPurchaseDate) {
            const ageInMs = currentDate.getTime() - latestPurchaseDate.getTime();
            const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
            daysOfInventory = ageInDays;
          }

          // Get pricing information
          const retailPriceUsd = parseFloat(String(product.retailPriceUsd || 0));
          const wholesalePrice1 = parseFloat(String(product.dealerPrice1 || 0));
          const currentCost = parseFloat(String(product.cost || 0));
          const lockedValue = currentCost * totalInventory;

          // Determine recommendation based on three-tier system
          // Check from most severe to least severe (longest period first)
          let recommendation = '';

          // Red tier: >120d old, sales < 10% of inventory in last 90 days
          if (currentStock > 0) {
            const isOldEnough120 = typeof daysOfInventory === 'string' ||
                                  (typeof daysOfInventory === 'number' && daysOfInventory > 120);
            const salesThreshold90 = currentStock * 0.1;

            if (isOldEnough120 && qtySold90Days < salesThreshold90) {
              recommendation = '>120d old stock - no sales - clearance';
            }
          }

          // Orange tier: >90d old, sales < 10% of inventory in last 60 days
          if (currentStock > 0 && recommendation === '') {
            const isOldEnough90 = typeof daysOfInventory === 'string' ||
                                 (typeof daysOfInventory === 'number' && daysOfInventory > 90);
            const salesThreshold60 = currentStock * 0.1;

            if (isOldEnough90 && qtySold60Days < salesThreshold60) {
              recommendation = '>90d old stock/slower sales - check';
            }
          }

          // Yellow tier: >60d old, sales < 10% of inventory in last 30 days
          if (currentStock > 0 && recommendation === '') {
            const isOldEnough60 = typeof daysOfInventory === 'string' ||
                                 (typeof daysOfInventory === 'number' && daysOfInventory > 60);
            const salesThreshold30 = currentStock * 0.1;

            if (isOldEnough60 && qtySold30Days < salesThreshold30) {
              recommendation = '>60d old stock/slow sales - check';
            }
          }

          return {
            productName: product.productName,
            currentStock,
            inTransit,
            totalInventory,
            qtySoldLast30Days: qtySold30Days,
            qtySoldLast60Days: qtySold60Days,
            qtySoldLast90Days: qtySold90Days,
            daysOfInventory,
            retailPriceUsd,
            wholesalePrice1,
            currentCost,
            lockedValue: Number(lockedValue.toFixed(2)),
            recommendation
          };
        })
        .filter(item => {
          // Only include items with recommendations (those that meet criteria)
          return item.recommendation !== '';
        })
        .sort((a, b) => {
          // Sort by severity: red > orange > yellow, then by days of inventory
          const getPriority = (rec: string) => {
            if (rec.includes('clearance')) return 3;
            if (rec.includes('slower')) return 2;
            if (rec.includes('slow')) return 1;
            return 0;
          };

          const priorityDiff = getPriority(b.recommendation) - getPriority(a.recommendation);
          if (priorityDiff !== 0) return priorityDiff;

          // Within same priority, sort by days of inventory
          const aVal = typeof a.daysOfInventory === 'string' ? 999999 : a.daysOfInventory;
          const bVal = typeof b.daysOfInventory === 'string' ? 999999 : b.daysOfInventory;
          return bVal - aVal;
        });

      return deadStockAnalysis;
    } catch (error) {
      console.error('Error in getCompstyleDeadStock:', error);
      return [];
    }
  }

  // Profitability Heat Map
  async getProfitabilityHeatMap(): Promise<Array<{
    productName: string;
    retailPriceUsd: number;
    cost: number;
    profitPerUnit: number;
    profitMargin: number;
    qtySold: number;
    totalProfit: number;
    totalStock: number;
    potentialProfit: number;
    marginLevel: 'excellent' | 'good' | 'low' | 'negative';
    urgentRefill: boolean;
    daysUntilStockOut: number;
  }>> {
    try {
      // Get actual sales data from Total Sales (contains real sale prices and costs)
      const totalSales = await db.select().from(compstyleTotalSales);
      const totalStock = await db.select().from(compstyleTotalStock);
      const salesVelocity = await this.getCompstyleSalesVelocity();

      // Aggregate sales data by product name (combine multiple periods)
      const salesByProduct = new Map<string, {
        totalQtySold: number;
        totalRevenue: number;
        totalCost: number;
      }>();

      totalSales.forEach(product => {
        const salePriceUsd = parseFloat(product.salePriceUsd || '0');
        const costPriceUsd = parseFloat(product.costPriceUsd || '0');
        const qtySold = product.qtySold || 0;

        if (qtySold === 0) return;

        const existing = salesByProduct.get(product.productName) || {
          totalQtySold: 0,
          totalRevenue: 0,
          totalCost: 0,
        };

        existing.totalQtySold += qtySold;
        existing.totalRevenue += salePriceUsd * qtySold;
        existing.totalCost += costPriceUsd * qtySold;

        salesByProduct.set(product.productName, existing);
      });

      // Create a stock lookup map
      const stockMap = new Map(
        totalStock.map(item => [item.productName, item.qtyInStock || 0])
      );

      // Create a velocity lookup map
      const velocityMap = new Map(
        salesVelocity.map(v => [v.productName, v.dailyVelocity])
      );

      const profitabilityData = Array.from(salesByProduct.entries())
        .map(([productName, sales]) => {
          const qtySold = sales.totalQtySold;
          const avgSalePriceUsd = sales.totalRevenue / qtySold; // Weighted average sale price
          const avgCostPriceUsd = sales.totalCost / qtySold; // Weighted average cost
          const currentStock = stockMap.get(productName) || 0;

          // Skip if no pricing data
          if (avgSalePriceUsd === 0 && avgCostPriceUsd === 0) return null;

          const profitPerUnit = avgSalePriceUsd - avgCostPriceUsd;
          const profitMargin = avgCostPriceUsd > 0 ? ((avgSalePriceUsd - avgCostPriceUsd) / avgCostPriceUsd) * 100 : 0;
          const totalProfit = sales.totalRevenue - sales.totalCost; // Actual profit from all sales
          const potentialProfit = profitPerUnit * currentStock; // Potential profit from current stock

          // Calculate days until stock out
          const dailyVelocity = velocityMap.get(productName) || 0;
          const daysUntilStockOut = dailyVelocity > 0
            ? currentStock / dailyVelocity
            : 999;

          // Urgent refill alert: margin >20% AND (stock <10 days OR zero)
          const urgentRefill = profitMargin > 20 && (daysUntilStockOut < 10 || currentStock === 0);

          // Determine margin level
          let marginLevel: 'excellent' | 'good' | 'low' | 'negative';
          if (profitMargin < 0) {
            marginLevel = 'negative';
          } else if (profitMargin >= 30) {
            marginLevel = 'excellent';
          } else if (profitMargin >= 15) {
            marginLevel = 'good';
          } else {
            marginLevel = 'low';
          }

          return {
            productName,
            retailPriceUsd: avgSalePriceUsd, // Weighted average sale price
            cost: avgCostPriceUsd, // Weighted average cost
            profitPerUnit,
            profitMargin,
            qtySold, // Total quantity sold across all periods
            totalProfit, // Actual profit from all sales
            totalStock: currentStock,
            potentialProfit, // Potential profit if we sell current stock at same margin
            marginLevel,
            urgentRefill,
            daysUntilStockOut: Number(daysUntilStockOut.toFixed(1)),
          };
        })
        .filter(item => item !== null) // Remove nulls
        .sort((a, b) => b!.profitMargin - a!.profitMargin); // Sort by margin (highest first)

      return profitabilityData;
    } catch (error) {
      console.error('Error calculating profitability heat map:', error);
      throw error;
    }
  }

  async getCompstyleDataOverview(): Promise<{
    files: Array<{
      name: string;
      type: string;
      records: number;
      status: string;
    }>;
    totals: {
      totalFiles: number;
      totalRecords: number;
      lastUpdated: string;
    };
  }> {
    // Get actual data counts from all CompStyle tables
    const [
      totalStockCount,
      kievyanStockCount,
      sevanStockCount,
      transitCount,
      salesOrdersCount,
      salesItemsCount,
      purchaseOrdersCount,
      purchaseItemsCount,
      totalSalesCount,
      totalProcurementCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(compstyleTotalStock),
      db.select({ count: sql<number>`count(*)` }).from(compstyleKievyanStock),
      db.select({ count: sql<number>`count(*)` }).from(compstyleSevanStock),
      db.select({ count: sql<number>`count(*)` }).from(compstyleTransit),
      db.select({ count: sql<number>`count(*)` }).from(compstyleSalesOrders),
      db.select({ count: sql<number>`count(*)` }).from(compstyleSalesItems),
      db.select({ count: sql<number>`count(*)` }).from(compstylePurchaseOrders),
      db.select({ count: sql<number>`count(*)` }).from(compstylePurchaseItems),
      db.select({ count: sql<number>`count(*)` }).from(compstyleTotalSales),
      db.select({ count: sql<number>`count(*)` }).from(compstyleTotalProcurement)
    ]);

    const files = [
      { name: "Total Stock", type: "Inventory Snapshot", records: totalStockCount[0].count, status: "Processed" },
      { name: "Kievyan Stock", type: "Location Inventory", records: kievyanStockCount[0].count, status: "Processed" },
      { name: "Sevan Stock", type: "Location Inventory", records: sevanStockCount[0].count, status: "Processed" },
      { name: "In Transit", type: "Transit Data", records: transitCount[0].count, status: "Processed" },
      { name: "Sales Orders", type: "Order Processing", records: salesOrdersCount[0].count, status: "Processed" },
      { name: "Sales Items", type: "Line Items", records: salesItemsCount[0].count, status: "Processed" },
      { name: "Purchase Orders", type: "Order Processing", records: purchaseOrdersCount[0].count, status: "Processed" },
      { name: "Purchase Items", type: "Line Items", records: purchaseItemsCount[0].count, status: "Processed" },
      { name: "Total Sales Report", type: "Analytics Report", records: totalSalesCount[0].count, status: "Processed" },
      { name: "Total Procurement Report", type: "Analytics Report", records: totalProcurementCount[0].count, status: "Processed" }
    ];

    const totalRecords = files.reduce((sum, file) => sum + file.records, 0);

    return {
      files,
      totals: {
        totalFiles: files.length,
        totalRecords,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  async getCompstyleTotalStock(): Promise<CompstyleTotalStock[]> {
    return await db.select().from(compstyleTotalStock);
  }

  async getCompstyleKievyanStock(): Promise<CompstyleKievyanStock[]> {
    return await db.select().from(compstyleKievyanStock);
  }

  async getCompstyleSevanStock(): Promise<CompstyleSevanStock[]> {
    return await db.select().from(compstyleSevanStock);
  }

  async getCompstyleTransit(): Promise<CompstyleTransit[]> {
    return await db.select().from(compstyleTransit);
  }

  async getCompstyleSalesOrders(): Promise<CompstyleSalesOrder[]> {
    return await db.select().from(compstyleSalesOrders);
  }

  async getCompstyleSalesItems(): Promise<CompstyleSalesItem[]> {
    return await db.select().from(compstyleSalesItems);
  }

  async getCompstylePurchaseOrders(): Promise<CompstylePurchaseOrder[]> {
    return await db.select().from(compstylePurchaseOrders);
  }

  async getCompstylePurchaseItems(): Promise<CompstylePurchaseItem[]> {
    return await db.select().from(compstylePurchaseItems);
  }

  async getCompstyleTotalSales(): Promise<CompstyleTotalSales[]> {
    return await db.select().from(compstyleTotalSales);
  }

  async getCompstyleTotalProcurement(): Promise<CompstyleTotalProcurement[]> {
    return await db.select().from(compstyleTotalProcurement);
  }

  // Product List methods
  async getCompstyleProductList(): Promise<CompstyleProductList[]> {
    return await db.select().from(compstyleProductList).orderBy(compstyleProductList.productName).limit(1000);
  }

  async getCompstyleProductListPaginated(limit: number, offset: number): Promise<CompstyleProductList[]> {
    // Use a more efficient query with explicit column selection to reduce memory overhead
    return await db
      .select({
        id: compstyleProductList.id,
        sku: compstyleProductList.sku,
        productName: compstyleProductList.productName,
        stock: compstyleProductList.stock,
        transit: compstyleProductList.transit,
        retailPriceUsd: compstyleProductList.retailPriceUsd,
        retailPriceAmd: compstyleProductList.retailPriceAmd,
        dealerPrice1: compstyleProductList.dealerPrice1,
        dealerPrice2: compstyleProductList.dealerPrice2,
        cost: compstyleProductList.cost,
        latestPurchase: compstyleProductList.latestPurchase,
        latestCost: compstyleProductList.latestCost,
        aveSalesPrice: compstyleProductList.aveSalesPrice,
        actualPrice: compstyleProductList.actualPrice,
        actualCost: compstyleProductList.actualCost,
        supplier: compstyleProductList.supplier,
        lastUpdated: compstyleProductList.lastUpdated,
      })
      .from(compstyleProductList)
      .orderBy(compstyleProductList.id)
      .limit(limit)
      .offset(offset);
  }

  async createCompstyleProductList(product: InsertCompstyleProductList): Promise<CompstyleProductList> {
    const [newProduct] = await db.insert(compstyleProductList).values(product).returning();
    return newProduct;
  }

  async updateCompstyleProductList(id: number, product: Partial<InsertCompstyleProductList>): Promise<CompstyleProductList> {
    const [updatedProduct] = await db.update(compstyleProductList)
      .set({ ...product, lastUpdated: new Date() })
      .where(eq(compstyleProductList.id, id))
      .returning();
    return updatedProduct;
  }

  async upsertCompstyleProductList(product: InsertCompstyleProductList): Promise<CompstyleProductList> {
    try {
      // Try to find existing product by name
      const [existing] = await db.select().from(compstyleProductList)
        .where(eq(compstyleProductList.productName, product.productName));

      if (existing) {
        // Update existing
        return await this.updateCompstyleProductList(existing.id, product);
      } else {
        // Create new
        return await this.createCompstyleProductList(product);
      }
    } catch (error) {
      console.error('Error upserting product list:', error);
      throw error;
    }
  }

  async rebuildProductList(): Promise<number> {
    console.log('Rebuilding Product List from existing data...');

    // Clear existing product list
    await db.delete(compstyleProductList);

    // Collect all unique product names from all sources
    const productMap = new Map<string, any>();

    // 1. Get products from Total Stock (primary source for pricing and SKU)
    const totalStock = await db.select().from(compstyleTotalStock);
    totalStock.forEach(item => {
      productMap.set(item.productName, {
        productName: item.productName,
        sku: item.sku,
        stock: item.qtyInStock,
        transit: 0,
        retailPriceUsd: item.retailPriceUsd,
        retailPriceAmd: item.retailPriceAmd,
        dealerPrice1: item.wholesalePrice1,
        dealerPrice2: item.wholesalePrice2,
        cost: item.currentCost,
      });
    });

    // 2. Add transit quantities
    const transitData = await db.select().from(compstyleTransit);
    transitData.forEach(item => {
      const existing = productMap.get(item.productName) || {
        productName: item.productName,
        stock: 0,
        transit: 0,
      };
      existing.transit = (existing.transit || 0) + (item.qty || 0);
      if (!existing.latestPurchase && (item.purchasePriceUsd || item.currentCost)) {
        existing.latestPurchase = item.purchasePriceUsd || item.currentCost;
      }
      productMap.set(item.productName, existing);
    });

    // 3. Add latest cost and average sales price from sales data
    const salesData = await db.select().from(compstyleTotalSales);
    salesData.forEach(item => {
      const existing = productMap.get(item.productName) || {
        productName: item.productName,
        stock: 0,
        transit: 0,
      };
      existing.latestCost = item.costPriceUsd;
      existing.aveSalesPrice = item.salePriceUsd;
      productMap.set(item.productName, existing);
    });

    // 4. Add latest purchase prices from purchase data
    const purchaseData = await db.select().from(compstylePurchaseItems);
    purchaseData.forEach(item => {
      const existing = productMap.get(item.productName) || {
        productName: item.productName,
        stock: 0,
        transit: 0,
      };
      if (!existing.latestPurchase) {
        existing.latestPurchase = item.priceUsd;
      }
      productMap.set(item.productName, existing);
    });

    // 5. Add products that appear only in sales items (no longer in stock)
    const salesItems = await db.select().from(compstyleSalesItems);
    salesItems.forEach(item => {
      if (!productMap.has(item.productName)) {
        productMap.set(item.productName, {
          productName: item.productName,
          stock: 0,
          transit: 0,
        });
      }
    });

    // Insert all products into the Product List
    let count = 0;
    for (const [name, data] of productMap) {
      await this.createCompstyleProductList({
        productName: name,
        sku: data.sku || null,
        stock: data.stock || 0,
        transit: data.transit || 0,
        retailPriceUsd: data.retailPriceUsd || null,
        retailPriceAmd: data.retailPriceAmd || null,
        dealerPrice1: data.dealerPrice1 || null,
        dealerPrice2: data.dealerPrice2 || null,
        cost: data.cost || null,
        latestPurchase: data.latestPurchase || null,
        latestCost: data.latestCost || null,
        aveSalesPrice: data.aveSalesPrice || null,
        actualPrice: null,
        actualCost: null,
        supplier: null,
      });
      count++;
    }

    console.log(`Product List rebuilt with ${count} unique products`);
    return count;
  }

  // Phase 2: Supplier Performance Matrix
  async getSupplierPerformanceMatrix(): Promise<Array<{
    supplier: string;
    totalPurchases: number;
    avgPurchasePrice: number;
    priceCompetitiveness: number;
    avgLeadTimeDays: number;
    productsSupplied: number;
    performanceScore: number;
  }>> {
    try {
      const purchaseItems = await db.select().from(compstylePurchaseItems);
      const transitData = await db.select().from(compstyleTransit);
      const totalProcurement = await db.select().from(compstyleTotalProcurement);

      // Group purchases by supplier from transit data
      const supplierStats = new Map<string, {
        totalPurchases: number;
        totalCost: number;
        products: Set<string>;
        leadTimes: number[];
      }>();

      // Aggregate transit data (has supplier info)
      transitData.forEach(item => {
        if (!item.supplier) return;

        const stats = supplierStats.get(item.supplier) || {
          totalPurchases: 0,
          totalCost: 0,
          products: new Set(),
          leadTimes: []
        };

        stats.totalPurchases += item.qty;
        const price = parseFloat(item.purchasePriceUsd || '0');
        stats.totalCost += price * item.qty;
        stats.products.add(item.productName);

        // Assume 14-30 days lead time for transit items
        stats.leadTimes.push(Math.floor(Math.random() * 16) + 14);

        supplierStats.set(item.supplier, stats);
      });

      // Calculate market average prices
      const productPrices = new Map<string, number[]>();
      totalProcurement.forEach(item => {
        const price = parseFloat(item.purchasePriceUsd || '0');
        if (price > 0) {
          const prices = productPrices.get(item.productName) || [];
          prices.push(price);
          productPrices.set(item.productName, prices);
        }
      });

      const marketAverages = new Map<string, number>();
      productPrices.forEach((prices, product) => {
        const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        marketAverages.set(product, avg);
      });

      // Build performance matrix
      const performanceMatrix = Array.from(supplierStats.entries()).map(([supplier, stats]) => {
        const avgPurchasePrice = stats.totalCost / stats.totalPurchases;
        const avgLeadTimeDays = stats.leadTimes.reduce((sum, t) => sum + t, 0) / stats.leadTimes.length;

        // Calculate price competitiveness (lower is better, scale 0-100)
        let priceCompetitiveness = 75; // Default average
        const supplierProducts = Array.from(stats.products);
        if (supplierProducts.length > 0) {
          const competitivenessScores = supplierProducts
            .map(product => {
              const marketAvg = marketAverages.get(product);
              if (!marketAvg) return 50;
              const supplierPrice = avgPurchasePrice;
              // If supplier is 10% cheaper than market, score = 100
              // If supplier is market price, score = 75
              // If supplier is 10% more expensive, score = 50
              const priceDiff = (marketAvg - supplierPrice) / marketAvg;
              return Math.max(0, Math.min(100, 75 + (priceDiff * 250)));
            });
          priceCompetitiveness = competitivenessScores.reduce((sum, s) => sum + s, 0) / competitivenessScores.length;
        }

        // Performance score combines price and lead time
        const leadTimeScore = Math.max(0, 100 - (avgLeadTimeDays - 14) * 2); // Penalize long lead times
        const performanceScore = (priceCompetitiveness * 0.6) + (leadTimeScore * 0.4);

        return {
          supplier,
          totalPurchases: stats.totalPurchases,
          avgPurchasePrice: Number(avgPurchasePrice.toFixed(2)),
          priceCompetitiveness: Number(priceCompetitiveness.toFixed(1)),
          avgLeadTimeDays: Number(avgLeadTimeDays.toFixed(1)),
          productsSupplied: stats.products.size,
          performanceScore: Number(performanceScore.toFixed(1))
        };
      }).sort((a, b) => b.performanceScore - a.performanceScore);

      return performanceMatrix;
    } catch (error) {
      console.error('Error calculating supplier performance matrix:', error);
      throw error;
    }
  }

  // Inventory Movement Recommendations
  async getInventoryMovementRecommendations(): Promise<{
    recommendations: Array<{
      productName: string;
      currentKievyan: number;
      currentSevan: number;
      totalQty: number;
      optimalKievyan: number;
      optimalSevan: number;
      moveToKievyan: number;
      moveToSevan: number;
      priority: 'High' | 'Medium' | 'Low';
      kievyanSales90d: number;
      sevanSales90d: number;
    }>;
    summary: {
      totalProducts: number;
      productsNeedingTransfer: number;
      totalUnitsToMove: number;
    };
  }> {
    try {
      const kievyanStock = await db.select().from(compstyleKievyanStock);
      const sevanStock = await db.select().from(compstyleSevanStock);
      const salesOrders = await db.select().from(compstyleSalesOrders);
      const salesItems = await db.select().from(compstyleSalesItems);

      // Find latest order date
      let latestOrderDate: Date | null = null;
      for (const order of salesOrders) {
        if (order.orderDate) {
          if (!latestOrderDate || order.orderDate > latestOrderDate) {
            latestOrderDate = order.orderDate;
          }
        }
      }

      // Calculate 90 days sales by product and location
      const sales90dByProduct = new Map<string, { kievyan: number; sevan: number }>();

      if (latestOrderDate) {
        const ninetyDaysAgo = new Date(latestOrderDate);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        for (const order of salesOrders) {
          if (order.orderDate && order.orderDate >= ninetyDaysAgo && order.orderDate <= latestOrderDate) {
            const orderItems = salesItems.filter(item => item.salesOrderId === order.id);
            for (const item of orderItems) {
              if (!sales90dByProduct.has(item.productName)) {
                sales90dByProduct.set(item.productName, { kievyan: 0, sevan: 0 });
              }
              const sales = sales90dByProduct.get(item.productName)!;
              if (order.location === 'Kievyan') {
                sales.kievyan += item.qty;
              } else if (order.location === 'Sevan') {
                sales.sevan += item.qty;
              }
            }
          }
        }
      }

      // Build product name set
      const allProductNames = new Set<string>();
      kievyanStock.forEach(s => allProductNames.add(s.productName));
      sevanStock.forEach(s => allProductNames.add(s.productName));

      // Create stock maps - aggregate quantities for duplicate products
      const kievyanStockMap = new Map<string, number>();
      kievyanStock.forEach(s => {
        const current = kievyanStockMap.get(s.productName) || 0;
        kievyanStockMap.set(s.productName, current + s.qty);
      });

      const sevanStockMap = new Map<string, number>();
      sevanStock.forEach(s => {
        const current = sevanStockMap.get(s.productName) || 0;
        sevanStockMap.set(s.productName, current + s.qty);
      });

      // Helper function for optimal distribution (from stockmove.py)
      const getKievyanOptimal = (name: string, totalQty: number): number => {
        const nameLower = name.toLowerCase();
        const startsWith = (prefix: string) => nameLower.startsWith(prefix.toLowerCase());

        // 0% (all in Sevan)
        const zeroPrefixes = [
          "экран для проектора", "шурупы", "шкаф", "стол", "стул", "патч-панель", "кресло",
          "корпус racktower", "кабельный ввод", "компьютер cs"
        ];
        if (zeroPrefixes.some(p => startsWith(p))) return 0;

        // 1 piece only
        const onePrefixes = [
          "сумка для ноутбука", "принтер", "проектор", "ноутбук", "монитор",
          "корпус minitower", "корпус minitower", "ибп ups"
        ];
        if (onePrefixes.some(p => startsWith(p))) return Math.min(1, totalQty);

        // 10% (at least 1)
        const tenPrefixes = [
          "шредер", "кулер", "кронштейн", "колонки", "коврик для мыши", "картридж",
          "источник питания", "инструмент", "зарядное устройство", "док-станция",
          "джойстик", "держатель", "графический планшет", "батарейка", "kvm-коммуникатор"
        ];
        if (tenPrefixes.some(p => startsWith(p))) return Math.max(1, Math.ceil(totalQty * 0.1));

        // 100% (all in Kievyan)
        const hundredPrefixes = ["компьютер led"];
        if (hundredPrefixes.some(p => startsWith(p))) return totalQty;

        // Default: 20% (at least 1)
        return Math.max(1, Math.ceil(totalQty * 0.2));
      };

      // Calculate priorities based on sales velocity
      const calculatePriority = (productName: string, moveToKievyan: number, moveToSevan: number): 'High' | 'Medium' | 'Low' => {
        const sales = sales90dByProduct.get(productName) || { kievyan: 0, sevan: 0 };

        if (moveToKievyan > 0) {
          // Moving to Kievyan - priority based on Kievyan sales
          if (sales.kievyan >= 10) return 'High';
          if (sales.kievyan >= 5) return 'Medium';
          return 'Low';
        } else if (moveToSevan > 0) {
          // Moving to Sevan - priority based on Sevan sales
          if (sales.sevan >= 10) return 'High';
          if (sales.sevan >= 5) return 'Medium';
          return 'Low';
        }
        return 'Low';
      };

      // Process each product
      const recommendations = [];
      let totalUnitsToMove = 0;
      let productsNeedingTransfer = 0;

      for (const productName of Array.from(allProductNames).sort()) {
        const kievyanQty = kievyanStockMap.get(productName) || 0;
        const sevanQty = sevanStockMap.get(productName) || 0;
        const totalQty = kievyanQty + sevanQty;

        if (totalQty === 0) continue;

        const kievyanOptimal = getKievyanOptimal(productName, totalQty);
        const sevanOptimal = totalQty - kievyanOptimal;

        const moveToKievyan = Math.max(0, kievyanOptimal - kievyanQty);
        const moveToSevan = Math.max(0, kievyanQty - kievyanOptimal);

        const sales = sales90dByProduct.get(productName) || { kievyan: 0, sevan: 0 };

        if (moveToKievyan > 0 || moveToSevan > 0) {
          productsNeedingTransfer++;
          totalUnitsToMove += moveToKievyan + moveToSevan;

          const priority = calculatePriority(productName, moveToKievyan, moveToSevan);

          recommendations.push({
            productName,
            currentKievyan: kievyanQty,
            currentSevan: sevanQty,
            totalQty,
            optimalKievyan: kievyanOptimal,
            optimalSevan: sevanOptimal,
            moveToKievyan,
            moveToSevan,
            priority,
            kievyanSales90d: sales.kievyan,
            sevanSales90d: sales.sevan
          });
        }
      }

      // Sort by priority and quantity to move
      recommendations.sort((a, b) => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        const aQty = a.moveToKievyan + a.moveToSevan;
        const bQty = b.moveToKievyan + b.moveToSevan;
        return bQty - aQty;
      });

      return {
        recommendations,
        summary: {
          totalProducts: allProductNames.size,
          productsNeedingTransfer,
          totalUnitsToMove
        }
      };
    } catch (error) {
      console.error('Error calculating inventory movement:', error);
      throw error;
    }
  }

  // Phase 2: Location Optimization
  async getLocationOptimization(): Promise<{
    kievyan: {
      totalSales: number;
      totalRevenue: number;
      avgOrderValue: number;
      topProducts: Array<{productName: string; qty: number; revenue: number}>;
    };
    sevan: {
      totalSales: number;
      totalRevenue: number;
      avgOrderValue: number;
      topProducts: Array<{productName: string; qty: number; revenue: number}>;
    };
    transferRecommendations: Array<{
      productName: string;
      fromLocation: string;
      toLocation: string;
      qty: number;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    try {
      const salesOrders = await db.select().from(compstyleSalesOrders);
      const salesItems = await db.select().from(compstyleSalesItems);
      const kievyanStock = await db.select().from(compstyleKievyanStock);
      const sevanStock = await db.select().from(compstyleSevanStock);

      // Find the latest order date across all sales orders
      let latestOrderDate: Date | null = null;
      for (const order of salesOrders) {
        if (order.orderDate) {
          if (!latestOrderDate || order.orderDate > latestOrderDate) {
            latestOrderDate = order.orderDate;
          }
        }
      }

      // If no orders found, return empty data
      if (!latestOrderDate) {
        return {
          kievyan: {
            totalSales: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            topProducts: []
          },
          sevan: {
            totalSales: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            topProducts: []
          },
          transferRecommendations: []
        };
      }

      // Calculate the date 30 days before the latest order date
      const thirtyDaysAgo = new Date(latestOrderDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Filter orders to only include last 30 days
      const recentOrders = salesOrders.filter(o =>
        o.orderDate && o.orderDate >= thirtyDaysAgo && o.orderDate <= latestOrderDate
      );

      // Analyze Kievyan performance (last 30 days only)
      const kievyanOrders = recentOrders.filter(o => o.location === 'Kievyan');
      const kievyanOrderIds = new Set(kievyanOrders.map(o => o.id));
      const kievyanItems = salesItems.filter(i => i.salesOrderId && kievyanOrderIds.has(i.salesOrderId));

      const kievyanRevenue = kievyanItems.reduce((sum, item) => sum + parseFloat(item.sumUsd || '0'), 0);
      const kievyanProductSales = new Map<string, {qty: number; revenue: number}>();

      kievyanItems.forEach(item => {
        const stats = kievyanProductSales.get(item.productName) || {qty: 0, revenue: 0};
        stats.qty += item.qty;
        stats.revenue += parseFloat(item.sumUsd || '0');
        kievyanProductSales.set(item.productName, stats);
      });

      // Analyze Sevan performance (last 30 days only)
      const sevanOrders = recentOrders.filter(o => o.location === 'Sevan');
      const sevanOrderIds = new Set(sevanOrders.map(o => o.id));
      const sevanItems = salesItems.filter(i => i.salesOrderId && sevanOrderIds.has(i.salesOrderId));

      const sevanRevenue = sevanItems.reduce((sum, item) => sum + parseFloat(item.sumUsd || '0'), 0);
      const sevanProductSales = new Map<string, {qty: number; revenue: number}>();

      sevanItems.forEach(item => {
        const stats = sevanProductSales.get(item.productName) || {qty: 0, revenue: 0};
        stats.qty += item.qty;
        stats.revenue += parseFloat(item.sumUsd || '0');
        sevanProductSales.set(item.productName, stats);
      });

      // Get top products for each location
      const kievyanTop = Array.from(kievyanProductSales.entries())
        .map(([productName, stats]) => ({productName, ...stats}))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const sevanTop = Array.from(sevanProductSales.entries())
        .map(([productName, stats]) => ({productName, ...stats}))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Generate transfer recommendations
      const transferRecommendations = [];
      const kievyanStockMap = new Map(kievyanStock.map(s => [s.productName, s.qty]));
      const sevanStockMap = new Map(sevanStock.map(s => [s.productName, s.qty]));

      // Check if Kievyan has high demand but low stock
      kievyanProductSales.forEach((stats, productName) => {
        const kStock = kievyanStockMap.get(productName) || 0;
        const sStock = sevanStockMap.get(productName) || 0;
        const dailySales = stats.qty / 30; // Approximate daily sales

        if (dailySales > 0 && kStock < dailySales * 7 && sStock > dailySales * 14) {
          transferRecommendations.push({
            productName,
            fromLocation: 'Sevan',
            toLocation: 'Kievyan',
            qty: Math.ceil(dailySales * 14),
            reason: 'High demand at Kievyan, excess stock at Sevan',
            priority: kStock < dailySales * 3 ? 'high' : 'medium' as 'high' | 'medium' | 'low'
          });
        }
      });

      // Check if Sevan has high demand but low stock
      sevanProductSales.forEach((stats, productName) => {
        const sStock = sevanStockMap.get(productName) || 0;
        const kStock = kievyanStockMap.get(productName) || 0;
        const dailySales = stats.qty / 30;

        if (dailySales > 0 && sStock < dailySales * 7 && kStock > dailySales * 14) {
          transferRecommendations.push({
            productName,
            fromLocation: 'Kievyan',
            toLocation: 'Sevan',
            qty: Math.ceil(dailySales * 14),
            reason: 'High demand at Sevan, excess stock at Kievyan',
            priority: sStock < dailySales * 3 ? 'high' : 'medium' as 'high' | 'medium' | 'low'
          });
        }
      });

      return {
        kievyan: {
          totalSales: kievyanOrders.length,
          totalRevenue: Number(kievyanRevenue.toFixed(2)),
          avgOrderValue: kievyanOrders.length > 0 ? Number((kievyanRevenue / kievyanOrders.length).toFixed(2)) : 0,
          topProducts: kievyanTop
        },
        sevan: {
          totalSales: sevanOrders.length,
          totalRevenue: Number(sevanRevenue.toFixed(2)),
          avgOrderValue: sevanOrders.length > 0 ? Number((sevanRevenue / sevanOrders.length).toFixed(2)) : 0,
          topProducts: sevanTop
        },
        transferRecommendations: transferRecommendations.sort((a, b) => {
          const priorityOrder = {high: 3, medium: 2, low: 1};
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }).slice(0, 20)
      };
    } catch (error) {
      console.error('Error calculating location optimization:', error);
      throw error;
    }
  }

  // Phase 2: Order Recommendations Engine
  async getOrderRecommendationsEngine(): Promise<Array<{
    productName: string;
    stock: number;
    transit: number;
    sold30d: number;
    sold60d: number;
    sold90d: number;
    sold120d: number;
    sold150d: number;
    sold180d: number;
    optimalOrderQty: number;
    lastSupplier: string;
    lastPrice: number;
    currentCost: number;
    expectedProfit: number;
    profitMargin: number;
    stockOutRisk: number;
    priorityScore: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }>> {
    try {
      const stockOutRisk = await this.getCompstyleStockOutRisk();
      const profitability = await this.getProfitabilityHeatMap();
      const productList = await db.select().from(compstyleProductList);
      const purchaseOrders = await db.select().from(compstylePurchaseOrders);
      const purchaseItems = await db.select().from(compstylePurchaseItems);
      const salesOrders = await db.select().from(compstyleSalesOrders);
      const salesItems = await db.select().from(compstyleSalesItems);

      // Find the latest sales order date
      let latestOrderDate: Date | null = null;
      for (const order of salesOrders) {
        if (order.orderDate) {
          if (!latestOrderDate || order.orderDate > latestOrderDate) {
            latestOrderDate = order.orderDate;
          }
        }
      }

      if (!latestOrderDate) {
        return [];
      }

      // Calculate historical sales periods
      const thirtyDaysAgo = new Date(latestOrderDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sixtyDaysAgo = new Date(latestOrderDate);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const ninetyDaysAgo = new Date(latestOrderDate);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const oneHundredTwentyDaysAgo = new Date(latestOrderDate);
      oneHundredTwentyDaysAgo.setDate(oneHundredTwentyDaysAgo.getDate() - 120);

      const oneHundredFiftyDaysAgo = new Date(latestOrderDate);
      oneHundredFiftyDaysAgo.setDate(oneHundredFiftyDaysAgo.getDate() - 150);

      const oneHundredEightyDaysAgo = new Date(latestOrderDate);
      oneHundredEightyDaysAgo.setDate(oneHundredEightyDaysAgo.getDate() - 180);

      // Create order ID sets for each period
      const orders30d = new Set<number>();
      const orders60d = new Set<number>();
      const orders90d = new Set<number>();
      const orders120d = new Set<number>();
      const orders150d = new Set<number>();
      const orders180d = new Set<number>();

      for (const order of salesOrders) {
        if (order.orderDate && order.orderDate >= thirtyDaysAgo && order.orderDate <= latestOrderDate) {
          orders30d.add(order.id);
        }
        if (order.orderDate && order.orderDate >= sixtyDaysAgo && order.orderDate <= latestOrderDate) {
          orders60d.add(order.id);
        }
        if (order.orderDate && order.orderDate >= ninetyDaysAgo && order.orderDate <= latestOrderDate) {
          orders90d.add(order.id);
        }
        if (order.orderDate && order.orderDate >= oneHundredTwentyDaysAgo && order.orderDate <= latestOrderDate) {
          orders120d.add(order.id);
        }
        if (order.orderDate && order.orderDate >= oneHundredFiftyDaysAgo && order.orderDate <= latestOrderDate) {
          orders150d.add(order.id);
        }
        if (order.orderDate && order.orderDate >= oneHundredEightyDaysAgo && order.orderDate <= latestOrderDate) {
          orders180d.add(order.id);
        }
      }

      // Calculate sales for each product in each period
      const salesByPeriod = new Map<string, {
        sold30d: number;
        sold60d: number;
        sold90d: number;
        sold120d: number;
        sold150d: number;
        sold180d: number;
      }>();

      for (const item of salesItems) {
        const stats = salesByPeriod.get(item.productName) || {
          sold30d: 0, sold60d: 0, sold90d: 0, sold120d: 0, sold150d: 0, sold180d: 0
        };

        if (item.salesOrderId) {
          if (orders30d.has(item.salesOrderId)) stats.sold30d += item.qty;
          if (orders60d.has(item.salesOrderId)) stats.sold60d += item.qty;
          if (orders90d.has(item.salesOrderId)) stats.sold90d += item.qty;
          if (orders120d.has(item.salesOrderId)) stats.sold120d += item.qty;
          if (orders150d.has(item.salesOrderId)) stats.sold150d += item.qty;
          if (orders180d.has(item.salesOrderId)) stats.sold180d += item.qty;
        }

        salesByPeriod.set(item.productName, stats);
      }

      // Find last supplier and last price for each product
      const lastPurchaseInfo = new Map<string, {supplier: string; price: number; date: Date}>();

      // Create a map of purchase order IDs to their details
      const purchaseOrderMap = new Map<number, {supplier: string; orderDate: Date}>();
      for (const order of purchaseOrders) {
        if (order.orderDate) {
          purchaseOrderMap.set(order.id, {
            supplier: order.supplier || 'Unknown',
            orderDate: order.orderDate
          });
        }
      }

      // Now match purchase items with their orders
      for (const item of purchaseItems) {
        const productName = item.productName;

        if (item.purchaseOrderId) {
          const orderInfo = purchaseOrderMap.get(item.purchaseOrderId);
          if (orderInfo) {
            const price = parseFloat(item.priceUsd || '0');
            const existing = lastPurchaseInfo.get(productName);

            if (!existing || orderInfo.orderDate > existing.date) {
              lastPurchaseInfo.set(productName, {
                supplier: orderInfo.supplier,
                price: price,
                date: orderInfo.orderDate
              });
            }
          }
        }
      }

      // Create product info map
      const productInfoMap = new Map(
        productList.map(p => [p.productName, {
          stock: p.stock || 0,
          transit: p.transit || 0,
          cost: parseFloat(p.cost || '0'),
          latestCost: parseFloat(p.latestCost || '0')
        }])
      );

      // Create profitability map
      const profitMap = new Map(
        profitability.map(p => [p.productName, {
          margin: p.profitMargin,
          retailPrice: p.retailPriceUsd
        }])
      );

      // Generate recommendations for all products (not just stock-out risk)
      const allProductNames = new Set<string>();

      // Add all products from product list that have stock or transit
      for (const product of productList) {
        if ((product.stock && product.stock > 0) || (product.transit && product.transit > 0)) {
          allProductNames.add(product.productName);
        }
      }

      const recommendations = Array.from(allProductNames).map(productName => {
        const productInfo = productInfoMap.get(productName);
        const profit = profitMap.get(productName);
        const sales = salesByPeriod.get(productName) || {
          sold30d: 0, sold60d: 0, sold90d: 0, sold120d: 0, sold150d: 0, sold180d: 0
        };
        const lastPurchase = lastPurchaseInfo.get(productName);

        const stock = productInfo?.stock || 0;
        const transit = productInfo?.transit || 0;
        const currentCost = productInfo?.cost || productInfo?.latestCost || 0;
        const lastSupplier = lastPurchase?.supplier || 'Unknown';
        const lastPrice = lastPurchase?.price || 0;

        // Find if this product has a stock-out risk recommendation
        const riskInfo = stockOutRisk.find(r => r.productName === productName);
        const optimalQty = riskInfo?.recommendedOrder || 0;
        const daysUntilStockOut = riskInfo?.daysUntilStockOut || 999;

        const avgSalePrice = profit?.retailPrice || 0;

        // Calculate expected profit using current cost
        const expectedProfit = (avgSalePrice - currentCost) * optimalQty;

        // Calculate margin % using current cost: ((Sale Price - Cost) / Cost) × 100
        const profitMargin = currentCost > 0 ? ((avgSalePrice - currentCost) / currentCost) * 100 : 0;

        // Enhanced Priority Calculation
        // 1. Sales Activity Score (0-100): Based on recent sales across multiple periods
        const totalSalesLast180d = sales.sold180d || 0;
        const salesActivityScore = totalSalesLast180d > 0 ? Math.min(100, (totalSalesLast180d / 180) * 100 * 10) : 0;

        // 2. Stock Urgency Score (0-100): How critical is the stockout risk
        const stockOutUrgency = daysUntilStockOut <= 7 ? 100 :
                               daysUntilStockOut <= 14 ? 80 :
                               daysUntilStockOut <= 30 ? 60 :
                               daysUntilStockOut <= 60 ? 40 : 20;

        // 3. Profit Opportunity Score (0-100): Normalized expected profit
        // Scale based on expected profit (products with $1000+ expected profit get 100)
        const profitOpportunityScore = Math.min(100, (expectedProfit / 1000) * 100);

        // 4. Margin Quality Score (0-100): Normalized margin percentage
        const marginQualityScore = Math.min(100, profitMargin * 2); // 50% margin = 100 score

        // Combined Priority Score with weights:
        // - Sales Activity: 35% (must have sales to be priority)
        // - Stock Urgency: 30% (how soon we'll run out)
        // - Profit Opportunity: 20% (total profit potential)
        // - Margin Quality: 15% (profit per unit)
        const priorityScore =
          (salesActivityScore * 0.35) +
          (stockOutUrgency * 0.30) +
          (profitOpportunityScore * 0.20) +
          (marginQualityScore * 0.15);

        // Priority levels based on combined score
        let priority: 'critical' | 'high' | 'medium' | 'low';
        if (priorityScore >= 70 && salesActivityScore > 0) priority = 'critical';
        else if (priorityScore >= 50 && salesActivityScore > 0) priority = 'high';
        else if (priorityScore >= 30) priority = 'medium';
        else priority = 'low';

        return {
          productName,
          stock,
          transit,
          sold30d: sales.sold30d,
          sold60d: sales.sold60d,
          sold90d: sales.sold90d,
          sold120d: sales.sold120d,
          sold150d: sales.sold150d,
          sold180d: sales.sold180d,
          optimalOrderQty: optimalQty,
          lastSupplier,
          lastPrice: Number(lastPrice.toFixed(2)),
          currentCost: Number(currentCost.toFixed(2)),
          expectedProfit: Number(expectedProfit.toFixed(2)),
          profitMargin: Number(profitMargin.toFixed(1)),
          stockOutRisk: daysUntilStockOut,
          priorityScore: Number(priorityScore.toFixed(1)),
          priority
        };
      }).sort((a, b) => b.priorityScore - a.priorityScore);

      return recommendations;
    } catch (error) {
      console.error('Error generating order recommendations:', error);
      throw error;
    }
  }

  // ==================== CHIP ERP METHODS ====================

  // Currency methods
  async getChipCurrencyRates(): Promise<ChipCurrencyRate[]> {
    return await db.select().from(chipCurrencyRates);
  }

  async updateChipCurrencyRate(currency: string, rateToAMD: string): Promise<ChipCurrencyRate> {
    const [existing] = await db.select().from(chipCurrencyRates)
      .where(eq(chipCurrencyRates.currency, currency));

    if (existing) {
      const [updated] = await db.update(chipCurrencyRates)
        .set({ rateToAMD, lastUpdated: new Date() })
        .where(eq(chipCurrencyRates.currency, currency))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(chipCurrencyRates)
        .values({ currency, rateToAMD })
        .returning();
      return created;
    }
  }

  async convertToAMD(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'AMD') return amount;

    const [rate] = await db.select().from(chipCurrencyRates)
      .where(eq(chipCurrencyRates.currency, fromCurrency));

    if (!rate) {
      throw new Error(`Currency rate not found for ${fromCurrency}`);
    }

    return amount * parseFloat(rate.rateToAMD);
  }

  // Product methods
  async getChipProducts(): Promise<ChipProduct[]> {
    return await db.select().from(chipProducts).orderBy(chipProducts.name);
  }

  async getChipProduct(id: number): Promise<ChipProduct | undefined> {
    const [product] = await db.select().from(chipProducts)
      .where(eq(chipProducts.id, id));
    return product || undefined;
  }

  async createChipProduct(product: InsertChipProduct): Promise<ChipProduct> {
    const [newProduct] = await db.insert(chipProducts).values(product).returning();
    return newProduct;
  }

  async updateChipProduct(id: number, product: Partial<InsertChipProduct>): Promise<ChipProduct> {
    const [updated] = await db.update(chipProducts)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(chipProducts.id, id))
      .returning();
    return updated;
  }

  async deleteChipProduct(id: number): Promise<void> {
    await db.delete(chipProducts).where(eq(chipProducts.id, id));
  }

  async updateChipProductStock(id: number, stockChange: number, newAverageCost?: string): Promise<ChipProduct> {
    const [product] = await db.select().from(chipProducts)
      .where(eq(chipProducts.id, id));

    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    const newStock = (product.currentStock || 0) + stockChange;
    const updateData: any = {
      currentStock: newStock
    };

    if (newAverageCost !== undefined) {
      updateData.averageCost = newAverageCost;
    }

    const [updated] = await db.update(chipProducts)
      .set(updateData)
      .where(eq(chipProducts.id, id))
      .returning();

    return updated;
  }

  // Customer methods
  async getChipCustomers(): Promise<ChipCustomer[]> {
    return await db.select().from(chipCustomers).orderBy(chipCustomers.name);
  }

  async getChipCustomer(id: number): Promise<ChipCustomer | undefined> {
    const [customer] = await db.select().from(chipCustomers)
      .where(eq(chipCustomers.id, id));
    return customer || undefined;
  }

  async createChipCustomer(customer: InsertChipCustomer): Promise<ChipCustomer> {
    const [newCustomer] = await db.insert(chipCustomers).values(customer).returning();
    return newCustomer;
  }

  async updateChipCustomer(id: number, customer: Partial<InsertChipCustomer>): Promise<ChipCustomer> {
    const [updated] = await db.update(chipCustomers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(chipCustomers.id, id))
      .returning();
    return updated;
  }

  async deleteChipCustomer(id: number): Promise<void> {
    await db.delete(chipCustomers).where(eq(chipCustomers.id, id));
  }

  // Supplier methods
  async getChipSuppliers(): Promise<ChipSupplier[]> {
    return await db.select().from(chipSuppliers).orderBy(chipSuppliers.name);
  }

  async getChipSupplier(id: number): Promise<ChipSupplier | undefined> {
    const [supplier] = await db.select().from(chipSuppliers)
      .where(eq(chipSuppliers.id, id));
    return supplier || undefined;
  }

  async createChipSupplier(supplier: InsertChipSupplier): Promise<ChipSupplier> {
    const [newSupplier] = await db.insert(chipSuppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateChipSupplier(id: number, supplier: Partial<InsertChipSupplier>): Promise<ChipSupplier> {
    const [updated] = await db.update(chipSuppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(chipSuppliers.id, id))
      .returning();
    return updated;
  }

  async deleteChipSupplier(id: number): Promise<void> {
    await db.delete(chipSuppliers).where(eq(chipSuppliers.id, id));
  }

  // Purchase methods
  async getChipPurchases(): Promise<ChipPurchase[]> {
    return await db.select().from(chipPurchases)
      .orderBy(desc(chipPurchases.purchaseDate));
  }

  async getChipPurchase(id: number): Promise<ChipPurchase | undefined> {
    const [purchase] = await db.select().from(chipPurchases)
      .where(eq(chipPurchases.id, id));
    return purchase || undefined;
  }

  async getChipPurchaseWithItems(id: number): Promise<ChipPurchase & { items: ChipPurchaseItem[], supplier?: ChipSupplier }> {
    const [purchase] = await db.select().from(chipPurchases)
      .where(eq(chipPurchases.id, id));

    if (!purchase) {
      throw new Error(`Purchase with id ${id} not found`);
    }

    const items = await db.select().from(chipPurchaseItems)
      .where(eq(chipPurchaseItems.purchaseId, id));

    let supplier: ChipSupplier | undefined;
    if (purchase.supplierId) {
      const [sup] = await db.select().from(chipSuppliers)
        .where(eq(chipSuppliers.id, purchase.supplierId));
      supplier = sup;
    }

    return { ...purchase, items, supplier };
  }

  async createChipPurchase(purchase: InsertChipPurchase, items: InsertChipPurchaseItem[]): Promise<ChipPurchase> {
    const [newPurchase] = await db.insert(chipPurchases).values(purchase).returning();

    for (const item of items) {
      const itemData = {
        purchaseId: newPurchase.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitPriceAMD: item.unitPriceAMD,
        serialNumbers: (item.serialNumbers || []) as string[],
        totalPrice: item.totalPrice
      };

      await db.insert(chipPurchaseItems).values([itemData]);

      const [product] = await db.select().from(chipProducts)
        .where(eq(chipProducts.id, item.productId));

      if (product) {
        const oldStock = product.currentStock || 0;
        const oldCost = parseFloat(product.averageCost || '0');
        const newQty = item.quantity;
        const newCost = parseFloat(item.unitPriceAMD);

        const newAverageCost = oldStock + newQty > 0
          ? ((oldStock * oldCost) + (newQty * newCost)) / (oldStock + newQty)
          : newCost;

        await this.updateChipProductStock(
          item.productId,
          item.quantity,
          newAverageCost.toFixed(2)
        );
      }
    }

    return newPurchase;
  }

  async updateChipPurchase(id: number, purchase: Partial<InsertChipPurchase>): Promise<ChipPurchase> {
    const [updated] = await db.update(chipPurchases)
      .set({ ...purchase, updatedAt: new Date() })
      .where(eq(chipPurchases.id, id))
      .returning();
    return updated;
  }

  async deleteChipPurchase(id: number): Promise<void> {
    await db.delete(chipPurchaseItems).where(eq(chipPurchaseItems.purchaseId, id));
    await db.delete(chipPurchases).where(eq(chipPurchases.id, id));
  }

  // Sale methods
  async getChipSales(): Promise<ChipSale[]> {
    return await db.select().from(chipSales)
      .orderBy(desc(chipSales.saleDate));
  }

  async getChipSale(id: number): Promise<ChipSale | undefined> {
    const [sale] = await db.select().from(chipSales)
      .where(eq(chipSales.id, id));
    return sale || undefined;
  }

  async getChipSaleWithItems(id: number): Promise<ChipSale & { items: ChipSalesItem[], customer?: ChipCustomer }> {
    const [sale] = await db.select().from(chipSales)
      .where(eq(chipSales.id, id));

    if (!sale) {
      throw new Error(`Sale with id ${id} not found`);
    }

    const items = await db.select().from(chipSalesItems)
      .where(eq(chipSalesItems.saleId, id));

    let customer: ChipCustomer | undefined;
    if (sale.customerId) {
      const [cust] = await db.select().from(chipCustomers)
        .where(eq(chipCustomers.id, sale.customerId));
      customer = cust;
    }

    return { ...sale, items, customer };
  }

  async createChipSale(sale: InsertChipSale, items: InsertChipSaleItem[]): Promise<ChipSale> {
    let totalCostOfGoods = 0;

    for (const item of items) {
      const [product] = await db.select().from(chipProducts)
        .where(eq(chipProducts.id, item.productId));

      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }

      if ((product.currentStock || 0) < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const unitCost = parseFloat(product.averageCost || '0');
      const totalCost = unitCost * item.quantity;
      totalCostOfGoods += totalCost;

      await this.updateChipProductStock(item.productId, -item.quantity);
    }

    const totalAmountAMD = parseFloat(sale.totalAmountAMD);
    const profit = totalAmountAMD - totalCostOfGoods;

    const [newSale] = await db.insert(chipSales).values({
      ...sale,
      costOfGoods: totalCostOfGoods.toFixed(2),
      profit: profit.toFixed(2)
    }).returning();

    for (const item of items) {
      const [product] = await db.select().from(chipProducts)
        .where(eq(chipProducts.id, item.productId));

      const unitCost = parseFloat(product!.averageCost || '0');
      const totalCost = unitCost * item.quantity;
      const itemProfit = parseFloat(item.totalPrice) - totalCost;

      const itemData = {
        saleId: newSale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitPriceAMD: item.unitPriceAMD,
        unitCost: unitCost.toFixed(2),
        serialNumbers: (item.serialNumbers || []) as string[],
        totalPrice: item.totalPrice,
        totalCost: totalCost.toFixed(2),
        profit: itemProfit.toFixed(2)
      };

      await db.insert(chipSalesItems).values([itemData]);
    }

    return newSale;
  }

  async updateChipSale(id: number, sale: Partial<InsertChipSale>): Promise<ChipSale> {
    const [updated] = await db.update(chipSales)
      .set({ ...sale, updatedAt: new Date() })
      .where(eq(chipSales.id, id))
      .returning();
    return updated;
  }

  async deleteChipSale(id: number): Promise<void> {
    await db.delete(chipSalesItems).where(eq(chipSalesItems.saleId, id));
    await db.delete(chipSales).where(eq(chipSales.id, id));
  }

  // Invoice methods
  async getChipInvoices(): Promise<ChipInvoice[]> {
    return await db.select().from(chipInvoices)
      .orderBy(desc(chipInvoices.invoiceDate));
  }

  async getChipInvoice(id: number): Promise<ChipInvoice | undefined> {
    const [invoice] = await db.select().from(chipInvoices)
      .where(eq(chipInvoices.id, id));
    return invoice || undefined;
  }

  async getChipInvoiceWithItems(id: number): Promise<ChipInvoice & { items: ChipInvoiceItem[], customer?: ChipCustomer }> {
    const [invoice] = await db.select().from(chipInvoices)
      .where(eq(chipInvoices.id, id));

    if (!invoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }

    const items = await db.select().from(chipInvoiceItems)
      .where(eq(chipInvoiceItems.invoiceId, id));

    const [customer] = await db.select().from(chipCustomers)
      .where(eq(chipCustomers.id, invoice.customerId));

    return { ...invoice, items, customer };
  }

  async createChipInvoice(invoice: InsertChipInvoice, items: InsertChipInvoiceItem[]): Promise<ChipInvoice> {
    const [newInvoice] = await db.insert(chipInvoices).values(invoice).returning();

    for (const item of items) {
      await db.insert(chipInvoiceItems).values({
        ...item,
        invoiceId: newInvoice.id
      });
    }

    return newInvoice;
  }

  async updateChipInvoice(id: number, invoice: Partial<InsertChipInvoice>): Promise<ChipInvoice> {
    const [updated] = await db.update(chipInvoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(chipInvoices.id, id))
      .returning();
    return updated;
  }

  async deleteChipInvoice(id: number): Promise<void> {
    await db.delete(chipInvoiceItems).where(eq(chipInvoiceItems.invoiceId, id));
    await db.delete(chipInvoices).where(eq(chipInvoices.id, id));
  }

  // Expense methods
  async getChipExpenses(): Promise<ChipExpense[]> {
    return await db.select().from(chipExpenses)
      .orderBy(desc(chipExpenses.date));
  }

  async getChipExpense(id: number): Promise<ChipExpense | undefined> {
    const [expense] = await db.select().from(chipExpenses)
      .where(eq(chipExpenses.id, id));
    return expense || undefined;
  }

  async createChipExpense(expense: InsertChipExpense): Promise<ChipExpense> {
    const [newExpense] = await db.insert(chipExpenses).values(expense).returning();
    return newExpense;
  }

  async updateChipExpense(id: number, expense: Partial<InsertChipExpense>): Promise<ChipExpense> {
    const [updated] = await db.update(chipExpenses)
      .set(expense)
      .where(eq(chipExpenses.id, id))
      .returning();
    return updated;
  }

  async deleteChipExpense(id: number): Promise<void> {
    await db.delete(chipExpenses).where(eq(chipExpenses.id, id));
  }

  // Payment methods
  async getChipPayments(): Promise<ChipPayment[]>;
  async createChipPayment(payment: InsertChipPayment): Promise<ChipPayment>;
  async getChipPayments(): Promise<ChipPayment[]> {
    return await db.select().from(chipPayments)
      .orderBy(desc(chipPayments.paymentDate));
  }

  async createChipPayment(payment: InsertChipPayment): Promise<ChipPayment> {
    const [newPayment] = await db.insert(chipPayments).values(payment).returning();
    return newPayment;
  }

  // Dashboard & Analytics
  async getChipDashboardStats(): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalExpenses: number;
    netIncome: number;
    inventoryValue: number;
    accountsReceivable: number;
    accountsPayable: number;
    salesCount: number;
    purchaseCount: number;
  }> {
    const sales = await db.select().from(chipSales);
    const purchases = await db.select().from(chipPurchases);
    const expenses = await db.select().from(chipExpenses);
    const products = await db.select().from(chipProducts);

    const totalRevenue = sales.reduce((sum, sale) =>
      sum + parseFloat(sale.totalAmountAMD || '0'), 0);

    const totalProfit = sales.reduce((sum, sale) =>
      sum + parseFloat(sale.profit || '0'), 0);

    const totalExpenses = expenses
      .filter(exp => !exp.isPersonal)
      .reduce((sum, expense) => sum + parseFloat(expense.amountAMD || '0'), 0);

    const netIncome = totalProfit - totalExpenses;

    const inventoryValue = products.reduce((sum, product) => {
      const stock = product.currentStock || 0;
      const cost = parseFloat(product.averageCost || '0');
      return sum + (stock * cost);
    }, 0);

    const accountsReceivable = sales
      .filter(sale => sale.paymentStatus !== 'paid')
      .reduce((sum, sale) => {
        const total = parseFloat(sale.totalAmountAMD || '0');
        const paid = parseFloat(sale.paidAmount || '0');
        return sum + (total - paid);
      }, 0);

    const accountsPayable = purchases
      .filter(purchase => purchase.paymentStatus !== 'paid')
      .reduce((sum, purchase) => {
        const total = parseFloat(purchase.totalAmountAMD || '0');
        const paid = parseFloat(purchase.paidAmount || '0');
        return sum + (total - paid);
      }, 0);

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netIncome: Number(netIncome.toFixed(2)),
      inventoryValue: Number(inventoryValue.toFixed(2)),
      accountsReceivable: Number(accountsReceivable.toFixed(2)),
      accountsPayable: Number(accountsPayable.toFixed(2)),
      salesCount: sales.length,
      purchaseCount: purchases.length
    };
  }

  async getChipProfitLoss(startDate: Date, endDate: Date): Promise<{
    revenue: number;
    costOfGoods: number;
    grossProfit: number;
    expenses: { category: string; amount: number }[];
    totalExpenses: number;
    netIncome: number;
  }> {
    const sales = await db.select().from(chipSales)
      .where(and(
        sql`${chipSales.saleDate} >= ${startDate}`,
        sql`${chipSales.saleDate} <= ${endDate}`
      ));

    const expenses = await db.select().from(chipExpenses)
      .where(and(
        sql`${chipExpenses.date} >= ${startDate}`,
        sql`${chipExpenses.date} <= ${endDate}`,
        eq(chipExpenses.isPersonal, false)
      ));

    const revenue = sales.reduce((sum, sale) =>
      sum + parseFloat(sale.totalAmountAMD || '0'), 0);

    const costOfGoods = sales.reduce((sum, sale) =>
      sum + parseFloat(sale.costOfGoods || '0'), 0);

    const grossProfit = revenue - costOfGoods;

    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'other';
      const amount = parseFloat(expense.amountAMD || '0');
      const existing = acc.find(e => e.category === category);
      if (existing) {
        existing.amount += amount;
      } else {
        acc.push({ category, amount });
      }
      return acc;
    }, [] as { category: string; amount: number }[]);

    const totalExpenses = expensesByCategory.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = grossProfit - totalExpenses;

    return {
      revenue: Number(revenue.toFixed(2)),
      costOfGoods: Number(costOfGoods.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      expenses: expensesByCategory.map(e => ({
        category: e.category,
        amount: Number(e.amount.toFixed(2))
      })),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netIncome: Number(netIncome.toFixed(2))
    };
  }

  async getChipCashFlow(startDate: Date, endDate: Date): Promise<{
    salesRevenue: number;
    purchaseCosts: number;
    expenses: number;
    netCashFlow: number;
    paymentsByMethod: { method: string; amount: number }[];
  }> {
    const payments = await db.select().from(chipPayments)
      .where(and(
        sql`${chipPayments.paymentDate} >= ${startDate}`,
        sql`${chipPayments.paymentDate} <= ${endDate}`
      ));

    const sales = await db.select().from(chipSales)
      .where(and(
        sql`${chipSales.saleDate} >= ${startDate}`,
        sql`${chipSales.saleDate} <= ${endDate}`
      ));

    const purchases = await db.select().from(chipPurchases)
      .where(and(
        sql`${chipPurchases.purchaseDate} >= ${startDate}`,
        sql`${chipPurchases.purchaseDate} <= ${endDate}`
      ));

    const expenses = await db.select().from(chipExpenses)
      .where(and(
        sql`${chipExpenses.date} >= ${startDate}`,
        sql`${chipExpenses.date} <= ${endDate}`,
        eq(chipExpenses.isPersonal, false)
      ));

    const salesRevenue = sales.reduce((sum, sale) =>
      sum + parseFloat(sale.totalAmountAMD || '0'), 0);

    const purchaseCosts = purchases.reduce((sum, purchase) =>
      sum + parseFloat(purchase.totalAmountAMD || '0'), 0);

    const expensesTotal = expenses.reduce((sum, expense) =>
      sum + parseFloat(expense.amountAMD || '0'), 0);

    const netCashFlow = salesRevenue - purchaseCosts - expensesTotal;

    const paymentsByMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'unknown';
      const amount = parseFloat(payment.amountAMD || '0');
      const existing = acc.find(p => p.method === method);
      if (existing) {
        existing.amount += amount;
      } else {
        acc.push({ method, amount });
      }
      return acc;
    }, [] as { method: string; amount: number }[]);

    return {
      salesRevenue: Number(salesRevenue.toFixed(2)),
      purchaseCosts: Number(purchaseCosts.toFixed(2)),
      expenses: Number(expensesTotal.toFixed(2)),
      netCashFlow: Number(netCashFlow.toFixed(2)),
      paymentsByMethod: paymentsByMethod.map(p => ({
        method: p.method,
        amount: Number(p.amount.toFixed(2))
      }))
    };
  }
}

export const storage = new DatabaseStorage();
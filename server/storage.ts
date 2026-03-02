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
  chipPurchaseInvoices,
  chipPurchaseInvoiceItems,
  chipSalesInvoices,
  chipSalesInvoiceItems,
  type ChipPurchaseInvoice,
  type InsertChipPurchaseInvoice,
  type ChipPurchaseInvoiceItem,
  type InsertChipPurchaseInvoiceItem,
  type ChipSalesInvoice,
  type InsertChipSalesInvoice,
  type ChipSalesInvoiceItem,
  type InsertChipSalesInvoiceItem,
  aiConversations,
  aiMessages,
  type AiConversation,
  type InsertAiConversation,
  type AiMessage,
  type InsertAiMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc, inArray, sql, gte } from "drizzle-orm";

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
    suppliers?: string[];
    country?: string;
    category?: string;
    brand?: string;
    sourceType?: string;
    dateAdded?: string;
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
  updateCompstyleTransit(id: number, updates: any): Promise<CompstyleTransit>;
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

  // ==================== CHIP: Armenian Tax Invoice Methods ====================

  // Purchase Invoice Methods (Ստացված - Received from suppliers)
  getChipPurchaseInvoices(): Promise<ChipPurchaseInvoice[]>;
  getChipPurchaseInvoice(id: number): Promise<ChipPurchaseInvoice | undefined>;
  getChipPurchaseInvoiceByNumber(invoiceNumber: string): Promise<ChipPurchaseInvoice | undefined>;
  createChipPurchaseInvoice(invoice: InsertChipPurchaseInvoice, items: InsertChipPurchaseInvoiceItem[]): Promise<ChipPurchaseInvoice>;
  importPurchaseInvoices(invoices: Array<{ invoice: InsertChipPurchaseInvoice; items: InsertChipPurchaseInvoiceItem[] }>): Promise<{ imported: number; skipped: number; errors: string[] }>;

  // Sales Invoice Methods (Դուրս գրված - Issued to customers)
  getChipSalesInvoices(): Promise<ChipSalesInvoice[]>;
  getChipSalesInvoice(id: number): Promise<ChipSalesInvoice | undefined>;
  getChipSalesInvoiceByNumber(invoiceNumber: string): Promise<ChipSalesInvoice | undefined>;
  createChipSalesInvoice(invoice: InsertChipSalesInvoice, items: InsertChipSalesInvoiceItem[]): Promise<ChipSalesInvoice>;
  importSalesInvoices(invoices: Array<{ invoice: InsertChipSalesInvoice; items: InsertChipSalesInvoiceItem[] }>): Promise<{ imported: number; skipped: number; errors: string[] }>;

  // ==================== AI Agent Methods ====================
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getAiConversations(): Promise<AiConversation[]>;
  getAiConversation(id: number): Promise<AiConversation | undefined>;
  updateAiConversation(id: number, updates: Partial<InsertAiConversation>): Promise<AiConversation>;
  deleteAiConversation(id: number): Promise<void>;
  createAiMessage(message: InsertAiMessage): Promise<AiMessage>;
  getAiMessages(conversationId: number): Promise<AiMessage[]>;
  getAiDatabaseContext(): Promise<string>;
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
    
    // Batch inserts in chunks of 1000 to avoid stack overflow with large datasets
    const BATCH_SIZE = 1000;
    const allNewEntries: SearchIndex[] = [];
    
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const newEntries = await db.insert(searchIndex).values(batch).returning();
      allNewEntries.push(...newEntries);
    }
    
    return allNewEntries;
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
    suppliers?: string[];
    country?: string;
    category?: string;
    brand?: string;
    sourceType?: string;
    dateAdded?: string;
  }): Promise<SearchIndex[]> {
    let whereConditions = [];

    // Date Added filter
    if (filters.dateAdded) {
      const now = new Date();
      let cutoff: Date;
      if (filters.dateAdded === "today") {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filters.dateAdded === "3days") {
        cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      } else if (filters.dateAdded === "1week") {
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.dateAdded === "2weeks") {
        cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      } else if (filters.dateAdded === "1month") {
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (cutoff!) {
        whereConditions.push(gte(searchIndex.createdAt, cutoff));
      }
    }

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
    if (filters.suppliers && filters.suppliers.length > 0) {
      whereConditions.push(
        or(...filters.suppliers.map(s => ilike(searchIndex.supplier, `%${s}%`)))
      );
    } else if (filters.supplier) {
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

  async updateCompstyleTransit(id: number, updates: any): Promise<CompstyleTransit> {
    // Filter out undefined values and ensure we have valid fields to update
    const validUpdates: any = {};

    // List of valid fields that can be updated
    const validFields = [
      'productName', 'qty', 'priceUsd', 'sumUsd', 'sumAmd',
      'supplier', 'orderDate', 'expectedArrival', 'invoice',
      'transitMode', 'trackingNumber', 'notes', 'status', 'priority'
    ];

    for (const field of validFields) {
      if (updates.hasOwnProperty(field)) {
        // Handle date fields specially - ensure they're Date objects or null
        if (field === 'orderDate' || field === 'expectedArrival') {
          const value = updates[field];
          // Convert string dates to Date objects, handle null/empty
          if (value === null) {
            validUpdates[field] = null;
          } else if (value && value !== '') {
            validUpdates[field] = new Date(value);
          }
          // Skip undefined and empty strings - they don't represent a real update
        } else {
          const value = updates[field];
          // Add all other fields if they're not undefined
          if (value !== undefined) {
            validUpdates[field] = value;
          }
        }
      }
    }

    // If there are no valid updates, return the existing record
    if (Object.keys(validUpdates).length === 0) {
      const [existing] = await db.select()
        .from(compstyleTransit)
        .where(eq(compstyleTransit.id, id));
      if (!existing) {
        throw new Error(`Transit item with id ${id} not found`);
      }
      return existing;
    }

    const [updated] = await db.update(compstyleTransit)
      .set(validUpdates)
      .where(eq(compstyleTransit.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update transit item with id ${id}`);
    }

    return updated;
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
        // Component scores for detailed insight
        salesVolumeScore: Math.round(salesVolumeScore * 10) / 10,
        profitabilityScore: Math.round(profitabilityScore * 10) / 10,
        stockHealthScore: Math.round(stockHealth * 10) / 10,
        inventoryHealthScore: Math.round(inventoryHealthScore * 10) / 10
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
        const lowerName = name.toLowerCase();
        const startsWith = (prefix: string) => lowerName.startsWith(prefix.toLowerCase());
        const sales = sales90dByProduct.get(name) || { kievyan: 0, sevan: 0 };

        // 0% (all in Sevan)
        const zeroPrefixes = [
          "экран для проектора", "шурупы", "шкаф", "стол", "кресло",
          "патч-панель", "корпус rack"
        ];
        if (zeroPrefixes.some(p => startsWith(p))) return 0;

        // 1-2 pieces based on total inventory
        const oneOrTwoPrefixes = [
          "сумка для ноутбука", "сумка для фотоаппарата", "сумка/рюкзак для ноутбука",
          "сумка/чехол для ноутбука", "кулер для ноутбука", "принтер", "сканнер",
          "проектор", "ноутбук", "моноблок", "монитор",
          "корпус miditower", "корпус minitower", "корпус fulltower", "ибп ups"
        ];
        if (oneOrTwoPrefixes.some(p => startsWith(p))) {
          let baseQty = totalQty <= 10 ? 1 : 2;
          // Apply sales velocity adjustment
          if (sales.kievyan > sales.sevan) {
            baseQty = Math.min(totalQty, baseQty * 2); // Up to 100% increase
          }
          return Math.min(baseQty, totalQty);
        }

        // 10% to Kievyan / 90% to Sevan (at least 1)
        const tenPrefixes = [
          "шредер", "кулер", "кронштейн для мониторов", "кронштейн для проектора",
          "кронштейн для телевизора", "колонки", "колонка", "саундбар",
          "джойстик", "клавиатура", "коврик", "микрофон", "мышь",
          "наушники", "сетевой фильтр", "батарейка", "батарейка-аккумулятор"
        ];
        // Exclude "кулер для ноутбука" from general "кулер" category
        if (tenPrefixes.some(p => startsWith(p)) && !startsWith("кулер для ноутбука")) {
          let baseQty = Math.max(1, Math.ceil(totalQty * 0.1));
          // Apply sales velocity adjustment
          if (sales.kievyan > sales.sevan) {
            baseQty = Math.min(totalQty, Math.ceil(baseQty * 2)); // Up to 100% increase
          }
          return baseQty;
        }

        // 100% to Kievyan (all in Kievyan)
        const hundredPrefixes = ["компьютер led", "компьютер cs"];
        if (hundredPrefixes.some(p => startsWith(p))) return totalQty;

        // Default: 20% to Kievyan / 80% to Sevan (at least 1)
        let baseQty = Math.max(1, Math.ceil(totalQty * 0.2));
        // Apply sales velocity adjustment
        if (sales.kievyan > sales.sevan) {
          baseQty = Math.min(totalQty, Math.ceil(baseQty * 2)); // Up to 100% increase
        }
        return baseQty;
      };

      // Calculate priorities based on stock level and deviation from optimal
      const calculatePriority = (
        productName: string,
        currentKievyan: number,
        currentSevan: number,
        optimalKievyan: number,
        optimalSevan: number,
        moveToKievyan: number,
        moveToSevan: number
      ): 'High' | 'Medium' | 'Low' => {
        // Determine which location is receiving stock
        const isMovingToKievyan = moveToKievyan > 0;
        const destinationQty = isMovingToKievyan ? currentKievyan : currentSevan;
        const optimalQty = isMovingToKievyan ? optimalKievyan : optimalSevan;

        // Highest Priority: Zero stock at destination location
        if (destinationQty === 0 && (moveToKievyan > 0 || moveToSevan > 0)) {
          return 'High';
        }

        // Calculate deviation percentage at destination
        let deviationPercent = 0;
        if (optimalQty > 0) {
          deviationPercent = Math.abs(destinationQty - optimalQty) / optimalQty * 100;
        } else if (destinationQty > 0) {
          // For zero optimal cases, use absolute difference
          deviationPercent = destinationQty > 5 ? 100 : destinationQty * 20;
        }

        // High Deviation: > 50%
        if (deviationPercent > 50) return 'High';

        // Medium Deviation: 25-50%
        if (deviationPercent >= 25) return 'Medium';

        // Low Deviation: < 25%
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

          const priority = calculatePriority(
            productName,
            kievyanQty,
            sevanQty,
            kievyanOptimal,
            sevanOptimal,
            moveToKievyan,
            moveToSevan
          );

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
    priority: 'critical' | 'high' | 'medium' | 'low' | 'no';
  }>> {
    try {
      const stockOutRisk = await this.getCompstyleStockOutRisk();
      const profitability = await this.getProfitabilityHeatMap();
      const productList = await db.select().from(compstyleProductList);
      const purchaseOrders = await db.select().from(compstylePurchaseOrders);
      const purchaseItems = await db.select().from(compstylePurchaseItems);
      const salesOrders = await db.select().from(compstyleSalesOrders);
      const salesItems = await db.select().from(compstyleSalesItems);
      const transitItems = await db.select().from(compstyleTransit);

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

      // PRIORITY 1: Check transit data first (most recent purchases in transit)
      for (const transitItem of transitItems) {
        const price = parseFloat(transitItem.purchasePriceUsd || '0');
        const date = transitItem.orderDate || new Date();
        
        lastPurchaseInfo.set(transitItem.productName, {
          supplier: transitItem.supplier || 'Unknown',
          price: price,
          date: date
        });
      }

      // PRIORITY 2: Check purchase history (only for products not in transit)
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

            // Only update if product is not in transit (transit takes priority)
            // OR if this purchase is more recent than the existing one
            if (!existing || (orderInfo.orderDate > existing.date && !transitItems.some(t => t.productName === productName))) {
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
          retailPrice: p.retailPriceUsd,
          avgSalePrice: p.retailPriceUsd, // Alias for clarity
          profitMargin: p.profitMargin, // Alias for clarity
          expectedProfit: p.potentialProfit, // Use potential profit for expected profit calculation
          cost: p.cost // Include cost from Total Sales for fallback
        }])
      );

      // Generate recommendations for all products with sales history, transit inventory, or stock
      const allProductNames = new Set<string>();

      // Add all products from product list that have sales history, transit inventory, or current stock
      for (const product of productList) {
        const sales = salesByPeriod.get(product.productName);
        const hasSales = sales && (
          sales.sold30d > 0 || sales.sold60d > 0 || sales.sold90d > 0 ||
          sales.sold120d > 0 || sales.sold150d > 0 || sales.sold180d > 0
        );
        // Include products with: sales history OR transit inventory OR stock on hand
        const hasTransit = (product.transit || 0) > 0;
        const hasStock = (product.stock || 0) > 0;
        if (hasSales || hasTransit || hasStock) {
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
        
        // Get current cost with fallback logic:
        // 1. Try productInfo.cost (from Total Stock)
        // 2. Try productInfo.latestCost (from Total Sales)
        // 3. Try profit.cost (from Total Sales - most recent cost_price_usd)
        // 4. Default to 0
        let currentCost = productInfo?.cost || productInfo?.latestCost || 0;
        
        // If still no cost, try to get it from Total Sales costPriceUsd
        if (currentCost === 0 && profit?.cost) {
          currentCost = profit.cost;
        }
        
        const lastSupplier = lastPurchase?.supplier || 'Unknown';
        const lastPrice = lastPurchase?.price || 0;

        // Find if this product has a stock-out risk recommendation
        const riskInfo = stockOutRisk.find(r => r.productName === productName);
        const optimalQty = riskInfo?.recommendedOrder || 0;
        const avgSalePrice = profit?.retailPrice || 0;
        const profitMargin = profit?.profitMargin || 0;
        const daysUntilStockOut = riskInfo?.daysUntilStockOut || 999;
        const expectedProfit = optimalQty * currentCost * (profitMargin / 100);

        // COMPONENT 1 (50% weight): Current priority formula
        // 1. Sales Activity (35% weight) - Must have sales to be priority
        const maxSales = Math.max(sales.sold30d, sales.sold60d, sales.sold90d, sales.sold120d, sales.sold150d, sales.sold180d);
        const salesActivityScore = maxSales > 0 ? Math.min(100, (maxSales / 50) * 100) : 0;

        // 2. Stock Urgency (30% weight) - How soon we'll run out
        const stockOutUrgency = daysUntilStockOut <= 7 ? 100 :
                                daysUntilStockOut <= 14 ? 80 :
                                daysUntilStockOut <= 30 ? 60 :
                                daysUntilStockOut <= 60 ? 40 : 20;

        // 3. Profit Opportunity (20% weight) - Total profit potential
        const profitOpportunityScore = expectedProfit > 1000 ? 100 :
                                       expectedProfit > 500 ? 80 :
                                       expectedProfit > 200 ? 60 :
                                       expectedProfit > 50 ? 40 : 20;

        // 4. Margin Quality (15% weight) - Profit per unit
        const marginQualityScore = profitMargin >= 30 ? 100 :
                                   profitMargin >= 20 ? 80 :
                                   profitMargin >= 15 ? 60 :
                                   profitMargin >= 10 ? 40 : 20;

        // Component 1 Score
        const component1Score =
          (salesActivityScore * 0.35) +
          (stockOutUrgency * 0.30) +
          (profitOpportunityScore * 0.20) +
          (marginQualityScore * 0.15);

        // COMPONENT 2 (50% weight): Order Urgency Ratio
        // Formula: Order Qty / (Stock + Transit)
        const totalAvailable = stock + transit;
        let urgencyRatioScore = 0;

        if (optimalQty === 0) {
          urgencyRatioScore = 0; // No order needed
        } else if (totalAvailable === 0) {
          urgencyRatioScore = 100; // Critical - no stock/transit but need to order
        } else {
          const urgencyRatio = optimalQty / totalAvailable;
          if (urgencyRatio >= 3.0) urgencyRatioScore = 100; // Critical
          else if (urgencyRatio >= 2.0) urgencyRatioScore = 75; // High
          else if (urgencyRatio >= 1.0) urgencyRatioScore = 50; // Medium
          else if (urgencyRatio > 0.0) urgencyRatioScore = 25; // Low
          else urgencyRatioScore = 0; // No urgency
        }

        // FINAL PRIORITY SCORE: 50% Component 1 + 50% Component 2
        const priorityScore = (component1Score * 0.5) + (urgencyRatioScore * 0.5);

        // Priority levels based on final combined score
        let priority: 'critical' | 'high' | 'medium' | 'low' | 'no';
        if (optimalQty === 0) priority = 'no';
        else if (priorityScore >= 70) priority = 'critical';
        else if (priorityScore >= 50) priority = 'high';
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
      });

      return recommendations;
    } catch (error) {
      console.error('Error generating order recommendations:', error);
      throw error;
    }
  }

  // Tax Purchase Invoices
  async getChipPurchaseInvoices(): Promise<ChipPurchaseInvoice[]> {
    return await db.select().from(chipPurchaseInvoices).orderBy(desc(chipPurchaseInvoices.issueDate));
  }

  async getChipPurchaseInvoice(id: number): Promise<ChipPurchaseInvoice | undefined> {
    const [invoice] = await db.select().from(chipPurchaseInvoices).where(eq(chipPurchaseInvoices.id, id));
    return invoice || undefined;
  }

  async getChipPurchaseInvoiceByNumber(invoiceNumber: string): Promise<ChipPurchaseInvoice | undefined> {
    const [invoice] = await db.select().from(chipPurchaseInvoices).where(eq(chipPurchaseInvoices.invoiceNumber, invoiceNumber));
    return invoice || undefined;
  }

  async createChipPurchaseInvoice(invoice: InsertChipPurchaseInvoice, items: InsertChipPurchaseInvoiceItem[]): Promise<ChipPurchaseInvoice> {
    const [newInvoice] = await db.insert(chipPurchaseInvoices).values(invoice).returning();
    if (items.length > 0) {
      await db.insert(chipPurchaseInvoiceItems).values(items.map(item => ({ ...item, invoiceId: newInvoice.id })));
    }
    return newInvoice;
  }

  async importPurchaseInvoices(invoices: Array<{ invoice: InsertChipPurchaseInvoice; items: InsertChipPurchaseInvoiceItem[] }>): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    
    for (const { invoice, items } of invoices) {
      try {
        const existing = await this.getChipPurchaseInvoiceByNumber(invoice.invoiceNumber);
        if (existing) {
          skipped++;
          continue;
        }
        await this.createChipPurchaseInvoice(invoice, items);
        imported++;
      } catch (error) {
        errors.push(`Failed to import invoice ${invoice.invoiceNumber}: ${error}`);
      }
    }
    return { imported, skipped, errors };
  }

  // Tax Sales Invoices
  async getChipSalesInvoices(): Promise<ChipSalesInvoice[]> {
    return await db.select().from(chipSalesInvoices).orderBy(desc(chipSalesInvoices.issueDate));
  }

  async getChipSalesInvoice(id: number): Promise<ChipSalesInvoice | undefined> {
    const [invoice] = await db.select().from(chipSalesInvoices).where(eq(chipSalesInvoices.id, id));
    return invoice || undefined;
  }

  async getChipSalesInvoiceByNumber(invoiceNumber: string): Promise<ChipSalesInvoice | undefined> {
    const [invoice] = await db.select().from(chipSalesInvoices).where(eq(chipSalesInvoices.invoiceNumber, invoiceNumber));
    return invoice || undefined;
  }

  async createChipSalesInvoice(invoice: InsertChipSalesInvoice, items: InsertChipSalesInvoiceItem[]): Promise<ChipSalesInvoice> {
    const [newInvoice] = await db.insert(chipSalesInvoices).values(invoice).returning();
    if (items.length > 0) {
      await db.insert(chipSalesInvoiceItems).values(items.map(item => ({ ...item, invoiceId: newInvoice.id })));
    }
    return newInvoice;
  }

  async importSalesInvoices(invoices: Array<{ invoice: InsertChipSalesInvoice; items: InsertChipSalesInvoiceItem[] }>): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    
    for (const { invoice, items } of invoices) {
      try {
        const existing = await this.getChipSalesInvoiceByNumber(invoice.invoiceNumber);
        if (existing) {
          skipped++;
          continue;
        }
        await this.createChipSalesInvoice(invoice, items);
        imported++;
      } catch (error) {
        errors.push(`Failed to import invoice ${invoice.invoiceNumber}: ${error}`);
      }
    }
    return { imported, skipped, errors };
  }

  // ==================== AI Agent Methods ====================
  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [newConversation] = await db.insert(aiConversations).values(conversation).returning();
    return newConversation;
  }

  async getAiConversations(): Promise<AiConversation[]> {
    return await db.select().from(aiConversations).orderBy(desc(aiConversations.updatedAt));
  }

  async getAiConversation(id: number): Promise<AiConversation | undefined> {
    const [conversation] = await db.select().from(aiConversations).where(eq(aiConversations.id, id));
    return conversation || undefined;
  }

  async updateAiConversation(id: number, updates: Partial<InsertAiConversation>): Promise<AiConversation> {
    const [updated] = await db.update(aiConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiConversations.id, id))
      .returning();
    return updated;
  }

  async deleteAiConversation(id: number): Promise<void> {
    await db.delete(aiMessages).where(eq(aiMessages.conversationId, id));
    await db.delete(aiConversations).where(eq(aiConversations.id, id));
  }

  async createAiMessage(message: InsertAiMessage): Promise<AiMessage> {
    const [newMessage] = await db.insert(aiMessages).values(message).returning();
    await db.update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, message.conversationId));
    return newMessage;
  }

  async getAiMessages(conversationId: number): Promise<AiMessage[]> {
    return await db.select().from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(aiMessages.createdAt);
  }

  async getAiDatabaseContext(): Promise<string> {
    const [supplierCount] = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
    const [priceListItemCount] = await db.select({ count: sql<number>`count(*)` }).from(priceListItems);
    const [offerCount] = await db.select({ count: sql<number>`count(*)` }).from(offers);
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [searchIndexCount] = await db.select({ count: sql<number>`count(*)` }).from(searchIndex);
    const [productListCount] = await db.select({ count: sql<number>`count(*)` }).from(compstyleProductList);
    const [totalStockCount] = await db.select({ count: sql<number>`count(*)` }).from(compstyleTotalStock);
    const [transitCount] = await db.select({ count: sql<number>`count(*)` }).from(compstyleTransit);
    const [salesOrderCount] = await db.select({ count: sql<number>`count(*)` }).from(compstyleSalesOrders);
    const [purchaseOrderCount] = await db.select({ count: sql<number>`count(*)` }).from(compstylePurchaseOrders);
    const [purchaseInvoiceCount] = await db.select({ count: sql<number>`count(*)` }).from(chipPurchaseInvoices);
    const [salesInvoiceCount] = await db.select({ count: sql<number>`count(*)` }).from(chipSalesInvoices);

    // Get sample suppliers for context
    const sampleSuppliers = await db.select({
      name: suppliers.name,
      country: suppliers.country,
      reputation: suppliers.reputation,
    }).from(suppliers).limit(5);

    // Get sample products for context
    const sampleProducts = await db.select({
      productName: searchIndex.productName,
      supplier: searchIndex.supplier,
      brand: searchIndex.brand,
      price: searchIndex.price,
      currency: searchIndex.currency,
    }).from(searchIndex).limit(5);

    // Get sample stock items
    const sampleStock = await db.select({
      productName: compstyleProductList.productName,
      stock: compstyleProductList.stock,
      retailPriceUsd: compstyleProductList.retailPriceUsd,
    }).from(compstyleProductList).where(sql`${compstyleProductList.stock} > 0`).limit(5);

    return `
YOU ARE THE SUPHUB AI AGENT - A SPECIALIZED BUSINESS INTELLIGENCE ASSISTANT.

You are an AI agent for SupHub, a supplier management and business intelligence system for a computer hardware sales business. You have DIRECT ACCESS to the company's databases and can query real data.

=== YOUR IDENTITY ===
- Name: SupHub AI Agent
- Purpose: Help users analyze suppliers, products, inventory, sales, and tax invoices
- Company: Computer hardware sales business operating in Armenia
- Currency: AMD (Armenian Dram), USD, EUR, RUB supported

=== DATABASE SCHEMA ===

TABLE: suppliers (${supplierCount.count} records)
- id, name, country, email, phone, whatsapp
- reputation (1-10 scale), categories (array), brands (array)
- notes, isActive
Sample: ${sampleSuppliers.map(s => `${s.name} (${s.country}, Rep: ${s.reputation || 'N/A'})`).join('; ')}

TABLE: search_index (${searchIndexCount.count} searchable products)
- productName, supplier, brand, category
- price, currency, stock, source (priceList/offer)
Sample: ${sampleProducts.map(p => `${p.productName} by ${p.supplier} - ${p.price} ${p.currency}`).join('; ')}

TABLE: price_list_items (${priceListItemCount.count} records)
- From Excel price lists uploaded by suppliers
- productName, partNumber, brand, category, description
- price, currency, stock, leadTime

TABLE: offers (${offerCount.count} records)
- Text offers received via WhatsApp/email
- supplierName, message, receivedAt

TABLE: orders (${orderCount.count} records)
- Purchase orders to suppliers
- orderNumber, supplierId, status, totalAmount, currency

TABLE: compstyle_product_list (${productListCount.count} products)
- Our product catalog with pricing
- productName, sku, stock, transit
- retailPriceUsd, retailPriceAmd, dealerPriceUsd, cost
Sample: ${sampleStock.map(p => `${p.productName}: ${p.stock} in stock, $${p.retailPriceUsd}`).join('; ')}

TABLE: compstyle_total_stock (${totalStockCount.count} items)
- Inventory across warehouses

TABLE: compstyle_transit (${transitCount.count} items)
- Items in transit/on order

TABLE: compstyle_sales_orders (${salesOrderCount.count} orders)
- Customer sales orders
- salesOrderNumber, customer, location, totalAmountUsd

TABLE: compstyle_purchase_orders (${purchaseOrderCount.count} orders)
- Supplier purchase orders

TABLE: chip_purchase_invoices (${purchaseInvoiceCount.count} invoices)
- Armenian tax invoices received (VAT 20%)
- invoiceNumber, supplierName, supplierTin, total, issueDate

TABLE: chip_sales_invoices (${salesInvoiceCount.count} invoices)
- Armenian tax invoices issued (VAT 20%)
- invoiceNumber, customerName, customerTin, total, issueDate

=== WHAT YOU CAN DO ===
1. Search and list suppliers by country, reputation, or category
2. Find products across all supplier price lists and offers
3. Check current stock levels and pricing
4. Analyze sales orders and revenue
5. Review purchase orders and costs
6. Look up Armenian tax invoices (VAT 20%)
7. Compare prices across different suppliers
8. Generate business insights and recommendations

=== HOW TO RESPOND ===
- Always acknowledge you are the SupHub AI Agent with access to real business data
- When asked about data, query the databases and provide specific numbers
- Format data in tables when presenting multiple items
- Use Armenian Dram (AMD) for local transactions, USD for international
- Remember: 20% VAT applies to Armenian tax invoices
    `.trim();
  }
}


export const storage = new DatabaseStorage();
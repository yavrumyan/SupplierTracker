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
  type InsertCompstyleProductList
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
    dailyVelocity: number;
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
    totalStock: number;
    potentialProfit: number;
    marginLevel: 'excellent' | 'good' | 'low' | 'negative';
  }>>;
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
    productsToOrder: number;
    deadProducts: number;
    lockedMoney: number;
    salesVolume30Days: number;
  }> {
    // Get real analytics data
    const stockOutRisk = await this.getCompstyleStockOutRisk();
    const deadStock = await this.getCompstyleDeadStock();

    // Calculate locked money from total stock
    const totalStockData = await db.select().from(compstyleTotalStock);
    const lockedMoney = totalStockData.reduce((sum, item) => {
      const cost = parseFloat(String(item.currentCost || 0));
      return sum + (cost * item.qtyInStock);
    }, 0);

    // Calculate 30-day sales volume
    const salesData = await db.select().from(compstyleTotalSales);
    const salesVolume = salesData.reduce((sum, item) => {
      const price = parseFloat(String(item.salePriceUsd || 0));
      return sum + (price * item.qtySold);
    }, 0);

    return {
      productsToOrder: stockOutRisk.length,
      deadProducts: deadStock.length,
      lockedMoney: Math.round(lockedMoney),
      salesVolume30Days: Math.round(salesVolume)
    };
  }

  async getCompstyleSalesVelocity(): Promise<Array<{
    productName: string;
    qtySold: number;
    salesPeriodDays: number;
    dailyVelocity: number;
    weeklyVelocity: number;
    monthlyVelocity: number;
  }>> {
    // Get all sales items with their order dates
    const salesOrders = await db.select().from(compstyleSalesOrders);
    const salesItems = await db.select().from(compstyleSalesItems);

    // Create a map of order IDs to order dates
    const orderDateMap = new Map<number, Date>();
    salesOrders.forEach(order => {
      if (order.orderDate) {
        orderDateMap.set(order.id, order.orderDate);
      }
    });

    // Find the date range across all sales orders
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    salesOrders.forEach(order => {
      if (order.orderDate) {
        if (!minDate || order.orderDate < minDate) {
          minDate = order.orderDate;
        }
        if (!maxDate || order.orderDate > maxDate) {
          maxDate = order.orderDate;
        }
      }
    });

    // Calculate the actual period in days (default to 30 if no date range found)
    let actualPeriodDays = 30;
    if (minDate && maxDate) {
      const timeDiff = maxDate.getTime() - minDate.getTime();
      actualPeriodDays = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    }

    // Aggregate sales by product name from sales items
    const aggregatedSales = new Map<string, number>();

    for (const item of salesItems) {
      const currentQty = aggregatedSales.get(item.productName) || 0;
      aggregatedSales.set(item.productName, currentQty + item.qty);
    }

    // Convert aggregated data to result format
    const result = Array.from(aggregatedSales.entries()).map(([productName, qtySold]) => {
      const dailyVelocity = qtySold / actualPeriodDays;

      return {
        productName,
        qtySold,
        salesPeriodDays: actualPeriodDays,
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
    dailyVelocity: number;
    daysOfInventory: number | string;
    lockedValue: number;
    recommendation: string;
  }>> {
    const productList = await db.select().from(compstyleProductList);
    const salesVelocity = await this.getCompstyleSalesVelocity();
    const purchaseItems = await db.select().from(compstylePurchaseItems);
    const purchaseOrders = await db.select().from(compstylePurchaseOrders);
    const kievyanStock = await db.select().from(compstyleKievyanStock);

    const velocityMap = new Map(
      salesVelocity.map(v => [v.productName, { velocity: v.dailyVelocity, qtySold: v.qtySold }])
    );

    // Get the current date from Stock Kievyan Current (first record's upload date or current date)
    // In practice, we'll use the current date as a fallback
    const currentDate = new Date();

    // Create a map of product names to their latest purchase date
    const purchaseMap = new Map<string, Date>();

    // Find the latest purchase date for each product
    // Purchase items contain the product name directly
    for (const item of purchaseItems) {
      const productName = item.productName;

      // Find any order that could contain this product
      // Since we don't have a direct order-item relationship, we use the latest order date
      // that matches the time period when this product was purchased
      for (const order of purchaseOrders) {
        if (order.orderDate) {
          const existingDate = purchaseMap.get(productName);
          if (!existingDate || order.orderDate > existingDate) {
            purchaseMap.set(productName, order.orderDate);
          }
        }
      }
    }

    // Also create matches for similar product names (to handle exact string matching issues)
    for (const product of productList) {
      if (!purchaseMap.has(product.productName)) {
        // Try to find a purchase item with similar name
        for (const item of purchaseItems) {
          if (item.productName.trim() === product.productName.trim()) {
            // Find the latest order date for this purchase item
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
        const salesData = velocityMap.get(product.productName);
        const dailyVelocity = salesData?.velocity || 0;
        const qtySold = salesData?.qtySold || 0;
        const currentStock = product.stock || 0;
        const inTransit = 0; // Don't include transit in dead stock analysis
        const totalInventory = currentStock; // Only count actual stock, not transit

        // Calculate days of stock based on purchase date age
        let daysOfInventory: number | string = 'Long time ago';
        const latestPurchaseDate = purchaseMap.get(product.productName);

        if (latestPurchaseDate) {
          const ageInMs = currentDate.getTime() - latestPurchaseDate.getTime();
          const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
          daysOfInventory = ageInDays;
        }

        // Calculate locked value
        const cost = parseFloat(String(product.cost || 0));
        const lockedValue = cost * totalInventory;

        // Determine recommendation based on age and velocity
        let recommendation = '';
        if (typeof daysOfInventory === 'number') {
          if (daysOfInventory > 180 && dailyVelocity < 0.5) recommendation = 'Clearance sale recommended';
          else if (daysOfInventory > 90 && dailyVelocity < 1) recommendation = 'Reduce price to move stock';
          else recommendation = 'Monitor closely';
        } else {
          if (dailyVelocity === 0) recommendation = 'Very old stock - clearance needed';
          else recommendation = 'Old stock - check manually';
        }

        return {
          productName: product.productName,
          currentStock,
          inTransit,
          totalInventory,
          qtySoldLast30Days: qtySold,
          dailyVelocity: Number(dailyVelocity.toFixed(2)),
          daysOfInventory,
          lockedValue: Number(lockedValue.toFixed(2)),
          recommendation
        };
      })
      .filter(item => {
        // Dead stock criteria (ALL conditions must be met):
        // 1. Has inventory
        if (item.totalInventory <= 0) return false;

        // 2. Old stock (90+ days or unknown age)
        const isOldStock = typeof item.daysOfInventory === 'string' || 
                          (typeof item.daysOfInventory === 'number' && item.daysOfInventory > 90);
        if (!isOldStock) return false;

        // 3. Low recent sales (less than 10% of current inventory sold in last 30 days)
        const salesThreshold = item.currentStock * 0.1;
        const hasLowSales = item.qtySoldLast30Days < salesThreshold;

        return hasLowSales;
      })
      .sort((a, b) => {
        // Sort by days of inventory, treating "Long time ago" as highest
        const aVal = typeof a.daysOfInventory === 'string' ? 999999 : a.daysOfInventory;
        const bVal = typeof b.daysOfInventory === 'string' ? 999999 : b.daysOfInventory;
        return bVal - aVal;
      });

    return deadStockAnalysis;
  }

  async getProfitabilityHeatMap() {
    try {
      // Get actual sales data from Total Sales (contains real sale prices and costs)
      const totalSales = await db.select().from(compstyleTotalSales);
      const totalStock = await db.select().from(compstyleTotalStock);

      // Create a stock lookup map
      const stockMap = new Map(
        totalStock.map(item => [item.productName, item.qtyInStock || 0])
      );

      const profitabilityData = totalSales
        .map(product => {
          const salePriceUsd = parseFloat(product.salePriceUsd || '0'); // Actual sale price
          const costPriceUsd = parseFloat(product.costPriceUsd || '0'); // Actual cost at time of sale
          const qtySold = product.qtySold || 0;
          const currentStock = stockMap.get(product.productName) || 0;

          // Skip if no pricing data or no sales
          if (salePriceUsd === 0 && costPriceUsd === 0) return null;
          if (qtySold === 0) return null;

          const profitPerUnit = salePriceUsd - costPriceUsd;
          const profitMargin = salePriceUsd > 0 ? (profitPerUnit / salePriceUsd) * 100 : 0;
          const actualProfit = profitPerUnit * qtySold; // Actual profit from sales
          const potentialProfit = profitPerUnit * currentStock; // Potential profit from current stock

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
            productName: product.productName,
            retailPriceUsd: salePriceUsd, // Using actual sale price instead of retail
            cost: costPriceUsd, // Using actual cost at time of sale
            profitPerUnit,
            profitMargin,
            totalStock: currentStock,
            potentialProfit, // Potential profit if we sell current stock at same margin
            marginLevel,
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
}

export const storage = new DatabaseStorage();
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
  compstyleLocationStock,
  compstyleTransit,
  compstyleSalesOrders,
  compstyleSalesItems,
  compstylePurchaseOrders,
  compstylePurchaseItems,
  compstyleTotalSales,
  compstyleTotalProcurement,
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
  type CompstyleLocationStock,
  type InsertCompstyleLocationStock,
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
  type InsertCompstyleTotalProcurement
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

  // Import methods
  importSuppliers(suppliers: InsertSupplier[]): Promise<{imported: number, skipped: number, errors: string[]}>;

  // CompStyle methods
  createCompstyleLocation(location: InsertCompstyleLocation): Promise<CompstyleLocation>;
  getCompstyleLocations(): Promise<CompstyleLocation[]>;
  createCompstyleTotalStock(stock: InsertCompstyleTotalStock): Promise<CompstyleTotalStock>;
  createCompstyleLocationStock(stock: InsertCompstyleLocationStock): Promise<CompstyleLocationStock>;
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
  getCompstyleTotalStock(limit?: number): Promise<CompstyleTotalStock[]>;
  getCompstyleLocationStock(limit?: number): Promise<CompstyleLocationStock[]>;
  getCompstyleTransit(limit?: number): Promise<CompstyleTransit[]>;
  getCompstyleSalesOrders(limit?: number): Promise<CompstyleSalesOrder[]>;
  getCompstyleSalesItems(limit?: number): Promise<CompstyleSalesItem[]>;
  getCompstylePurchaseOrders(limit?: number): Promise<CompstylePurchaseOrder[]>;
  getCompstylePurchaseItems(limit?: number): Promise<CompstylePurchaseItem[]>;
  getCompstyleTotalSales(limit?: number): Promise<CompstyleTotalSales[]>;
  getCompstyleTotalProcurement(limit?: number): Promise<CompstyleTotalProcurement[]>;
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

  async createCompstyleLocationStock(stock: InsertCompstyleLocationStock): Promise<CompstyleLocationStock> {
    const [newStock] = await db.insert(compstyleLocationStock).values(stock).returning();
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
    // Placeholder calculations - will be replaced with real analytics
    return {
      productsToOrder: 127,
      deadProducts: 43,
      lockedMoney: 24680,
      salesVolume30Days: 186420
    };
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
      locationStockCount,
      transitCount,
      salesOrdersCount,
      salesItemsCount,
      purchaseOrdersCount,
      purchaseItemsCount,
      totalSalesCount,
      totalProcurementCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(compstyleTotalStock),
      db.select({ count: sql<number>`count(*)` }).from(compstyleLocationStock),
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
      { name: "Kievyan Stock", type: "Location Inventory", records: Math.floor(locationStockCount[0].count / 2), status: "Processed" },
      { name: "Sevan Stock", type: "Location Inventory", records: Math.ceil(locationStockCount[0].count / 2), status: "Processed" },
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

  async getCompstyleTotalStock(limit: number = 20): Promise<CompstyleTotalStock[]> {
    return await db.select().from(compstyleTotalStock).limit(limit);
  }

  async getCompstyleLocationStock(limit: number = 20): Promise<CompstyleLocationStock[]> {
    return await db.select().from(compstyleLocationStock).limit(limit);
  }

  async getCompstyleTransit(limit: number = 20): Promise<CompstyleTransit[]> {
    return await db.select().from(compstyleTransit).limit(limit);
  }

  async getCompstyleSalesOrders(limit: number = 20): Promise<CompstyleSalesOrder[]> {
    return await db.select().from(compstyleSalesOrders).limit(limit);
  }

  async getCompstyleSalesItems(limit: number = 20): Promise<CompstyleSalesItem[]> {
    return await db.select().from(compstyleSalesItems).limit(limit);
  }

  async getCompstylePurchaseOrders(limit: number = 20): Promise<CompstylePurchaseOrder[]> {
    return await db.select().from(compstylePurchaseOrders).limit(limit);
  }

  async getCompstylePurchaseItems(limit: number = 20): Promise<CompstylePurchaseItem[]> {
    return await db.select().from(compstylePurchaseItems).limit(limit);
  }

  async getCompstyleTotalSales(limit: number = 20): Promise<CompstyleTotalSales[]> {
    return await db.select().from(compstyleTotalSales).limit(limit);
  }

  async getCompstyleTotalProcurement(limit: number = 20): Promise<CompstyleTotalProcurement[]> {
    return await db.select().from(compstyleTotalProcurement).limit(limit);
  }
}

export const storage = new DatabaseStorage();

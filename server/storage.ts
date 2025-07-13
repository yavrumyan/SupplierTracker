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
  type InsertUser 
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
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.name, name));
    return supplier || undefined;
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

    return await db.select().from(suppliers).where(whereClause);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
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
}

export const storage = new DatabaseStorage();

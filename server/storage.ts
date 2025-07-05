import { 
  suppliers, 
  priceListFiles, 
  priceListItems, 
  offers, 
  orders, 
  orderItems, 
  costCalculationFiles, 
  inquiries,
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
  type User,
  type UpsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User methods - updated for authentication system
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
  // User methods - updated for authentication system
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
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
    const [newSupplier] = await db.insert(suppliers).values({
      name: supplier.name,
      country: supplier.country,
      website: supplier.website || null,
      email: supplier.email || null,
      phone: supplier.phone || null,
      whatsapp: supplier.whatsapp || null,
      reputation: supplier.reputation || null,
      workingStyle: supplier.workingStyle || [],
      categories: supplier.categories || [],
      brands: supplier.brands || [],
      comments: supplier.comments || null,
    }).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({
        ...supplier,
        workingStyle: supplier.workingStyle || [],
        categories: supplier.categories || [],
        brands: supplier.brands || [],
        updatedAt: new Date()
      })
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
}

export const storage = new DatabaseStorage();

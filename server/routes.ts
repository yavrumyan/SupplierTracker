import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { 
  insertSupplierSchema, 
  insertOfferSchema, 
  insertOrderSchema, 
  insertOrderItemSchema, 
  insertInquirySchema, 
  insertDocumentSchema,
  insertCompstyleTotalStockSchema,
  insertCompstyleLocationStockSchema,
  insertCompstyleTransitSchema,
  insertCompstyleSalesOrderSchema,
  insertCompstyleSalesItemSchema,
  insertCompstylePurchaseOrderSchema,
  insertCompstylePurchaseItemSchema,
  insertCompstyleTotalSalesSchema,
  insertCompstyleTotalProcurementSchema,
  insertChipPurchaseInvoiceSchema,
  insertChipPurchaseInvoiceItemSchema,
  insertChipSalesInvoiceSchema,
  insertChipSalesInvoiceItemSchema,
  insertAiConversationSchema,
  insertAiMessageSchema
} from "@shared/schema";
import { generateAIResponse, type LLMProvider } from "./ai-service";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import archiver from "archiver";
import os from "os";
import { put, del } from "@vercel/blob";
import { processPriceList } from "./excelProcessor";
// Removed bcrypt and cookie-parser as they are related to authentication
// import bcrypt from "bcrypt";
// import cookieParser from "cookie-parser";
import { db } from "./db";
import { users } from "@shared/schema";
import { 
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
  chipPurchaseInvoices,
  chipPurchaseInvoiceItems,
  chipSalesInvoices,
  chipSalesInvoiceItems
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// All uploads use memory storage — files are processed in-memory or sent to Vercel Blob
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload a buffer to Vercel Blob and return the URL (private store)
async function uploadToBlob(filename: string, buffer: Buffer, contentType?: string): Promise<string> {
  const blob = await put(filename, buffer, {
    access: "private",
    contentType: contentType || "application/octet-stream",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

// Helper: fetch a private Vercel Blob by URL, streaming it to the response
async function proxyBlobDownload(
  blobUrl: string,
  res: any,
  filename: string,
  contentType = "application/octet-stream"
): Promise<void> {
  const response = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (!response.ok) throw new Error(`Blob fetch failed: ${response.status}`);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}

// Helper: delete a file from Vercel Blob (no-op if URL is not a Blob URL)
async function deleteFromBlob(urlOrPath: string): Promise<void> {
  if (urlOrPath && urlOrPath.startsWith("https://")) {
    try { await del(urlOrPath); } catch { /* ignore if already gone */ }
  }
}

function normalizePrice(raw: string): string {
  // Comma followed by exactly 2 digits at the end → comma is decimal separator
  if (/,\d{2}$/.test(raw)) {
    return raw.replace(/\./g, '').replace(',', '.');
  }
  // Period followed by exactly 2 digits at the end → period is decimal separator
  if (/\.\d{2}$/.test(raw)) {
    return raw.replace(/,/g, '');
  }
  // Otherwise commas/periods are thousands separators — strip them
  return raw.replace(/[,\.]/g, '');
}

function extractPriceFromText(line: string): { cleanedName: string; price: string | null; currency: string | null } {
  // Match numbers adjacent to $, allowing both . and , as decimal/thousands separators
  const pattern = /(\d[\d,\.]*\d|\d)\$|\$(\d[\d,\.]*\d|\d)/;
  const match = line.match(pattern);
  if (match) {
    const raw = match[1] ?? match[2];
    const price = normalizePrice(raw);
    const cleanedName = line.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
    return { cleanedName, price, currency: 'USD' };
  }
  return { cleanedName: line, price: null, currency: null };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Removed cookie-parser middleware as it was for authentication
  // app.use(cookieParser());

  // Auth middleware
  const requireAuth = (req: any, res: Response, next: NextFunction) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // Protect all /api/* routes except auth endpoints
  app.use("/api", (req: any, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/auth/")) return next();
    return requireAuth(req, res, next);
  });

  // Auth endpoints (public — no requireAuth)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      (req.session as any).userId = user.id;
      // Explicitly save session before responding — critical on serverless (Vercel)
      // where the Lambda may terminate before the async DB write completes.
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session save failed" });
        }
        res.json({ id: user.id, username: user.username });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    try {
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ error: "User not found" });
      res.json({ id: user.id, username: user.username });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const { query, country, category, brand, minReputation, workingStyle } = req.query;

      const filters = {
        country: country as string,
        category: category as string,
        brand: brand as string,
        minReputation: minReputation ? parseInt(minReputation as string) : undefined,
        workingStyle: workingStyle as string,
      };

      const suppliers = await storage.searchSuppliers(query as string || "", filters);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);

      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Price list routes
  app.post("/api/suppliers/:id/price-lists", upload.single('file'), async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Create price list file record
      const priceListFile = await storage.createPriceListFile({
        supplierId,
        filename: file.originalname,
        originalName: file.originalname,
        filePath: "",
        fileSize: file.size,
      });

      // Process Excel file and extract data
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Insert price list items
      for (const row of data) {
        const item = row as any;
        await storage.createPriceListItem({
          priceListFileId: priceListFile.id,
          supplierId,
          productName: item.Product || item.Name || item.product || item.name || "",
          brand: item.Brand || item.brand || "",
          category: item.Category || item.category || "",
          price: item.Price || item.price || "0",
          stock: item.Stock || item.stock || item.Quantity || item.quantity || "",
        });
      }

      res.status(201).json(priceListFile);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload price list" });
    }
  });

  app.get("/api/suppliers/:id/price-lists", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const files = await storage.getPriceListFiles(supplierId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price lists" });
    }
  });

  app.get("/api/suppliers/:id/price-list-items", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const items = await storage.getPriceListItems(supplierId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch price list items" });
    }
  });

  // Offer routes
  app.post("/api/suppliers/:id/offers", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const offerData = insertOfferSchema.parse({ ...req.body, supplierId });
      const offer = await storage.createOffer(offerData);

      // Populate search index with offer data
      try {
        const supplier = await storage.getSupplier(supplierId);
        if (supplier) {
          // Parse offer content to extract product information
          const offerContent = offer.content || '';
          const lines = offerContent.split('\n').map(line => line.trim()).filter(line => line);

          // If no line breaks, treat the entire content as one product
          if (lines.length === 0 || (lines.length === 1 && lines[0].length <= 10)) {
            lines.push(offerContent.trim());
          }

          // Try to extract product information from each line
          for (const line of lines) {
            if (line.length > 3) { // Lower threshold to catch more products
              const { cleanedName, price, currency } = extractPriceFromText(line);
              const searchEntry = {
                supplierId: supplierId,
                sourceType: 'offer',
                sourceId: offer.id,
                supplier: supplier.name,
                category: null,
                brand: null,
                model: null,
                productName: cleanedName,
                price: price,
                currency: currency,
                stock: null,
                warranty: null,
                notes: `Source: ${offer.source}` // Add source information
              };

              await storage.createSearchIndexEntry(searchEntry);
            }
          }
        }
      } catch (searchIndexError) {
        console.error("Error populating search index for offer:", searchIndexError);
        // Don't fail the offer creation if search index population fails
      }

      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid offer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  app.get("/api/suppliers/:id/offers", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const offers = await storage.getOffers(supplierId);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.put("/api/offers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const offerData = insertOfferSchema.partial().parse(req.body);
      const offer = await storage.updateOffer(id, offerData);
      res.json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid offer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update offer" });
    }
  });

  app.delete("/api/offers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Delete related search index entries
      await storage.deleteSearchIndexBySource('offer', id);

      // Delete the offer
      await storage.deleteOffer(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete offer" });
    }
  });

  // Order routes
  app.post("/api/suppliers/:id/orders", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const orderData = insertOrderSchema.parse({ ...req.body, supplierId });
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/suppliers/:id/orders", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const orders = await storage.getOrders(supplierId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderWithItems(id);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Order item routes
  app.post("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemData = insertOrderItemSchema.parse({ ...req.body, orderId });
      const item = await storage.createOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order item" });
    }
  });

  app.put("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertOrderItemSchema.partial().parse(req.body);
      const item = await storage.updateOrderItem(id, itemData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid item data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update order item" });
    }
  });

  app.delete("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrderItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order item" });
    }
  });

  // Inquiry routes
  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquiryData = insertInquirySchema.parse(req.body);
      
      // Get supplier details for each supplier ID
      const suppliers: any[] = [];
      for (const supplierId of inquiryData.supplierIds) {
        const supplier = await storage.getSupplier(supplierId);
        if (supplier) {
          suppliers.push(supplier);
        }
      }

      // Send inquiries and collect results (awaited)
      let sendingResults: { supplier: string; email?: string; whatsapp?: string; whatsappLink?: string; error?: string }[] = [];
      
      try {
        const { sendInquiry } = await import("./services/inquiry-sender.ts");
        sendingResults = await sendInquiry(
          suppliers,
          inquiryData.message,
          inquiryData.sendViaWhatsApp ?? true,
          inquiryData.sendViaEmail ?? true
        );
        console.log("📊 Final sending results to return:", JSON.stringify(sendingResults));
      } catch (sendError) {
        console.error("Error sending inquiry:", sendError);
      }

      // Store the inquiry record
      const inquiry = await storage.createInquiry(inquiryData);
      
      // Return with sending results
      const responseData = { inquiry, sendingResults };
      console.log("📤 API Response being sent:", JSON.stringify(responseData));
      res.status(201).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inquiry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to send inquiry" });
    }
  });

  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  // Enhanced search endpoint for products across all sources
  app.get("/api/search", async (req, res) => {
    try {
      const { 
        keyword1 = '',
        keyword2 = '',
        keyword3 = '',
        source = '',
        country = '',
        supplier = '',
        suppliers = '',
        category = '', 
        brand = '', 
        dateAdded = '',
        page = '1',
        limit = '50'
      } = req.query;

      const suppliersArray = (suppliers as string)
        ? (suppliers as string).split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const filters = {
        supplier: supplier as string,
        suppliers: suppliersArray,
        country: country as string,
        category: category as string,
        brand: brand as string,
        sourceType: source as string,
        dateAdded: dateAdded as string
      };

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          delete filters[key];
        }
      });

      // Build combined search query for triple keyword search
      const keywords = [keyword1, keyword2, keyword3].filter(k => k && k.trim()).map(k => k.trim());
      const combinedQuery = keywords.join(' ');

      const searchResults = await storage.searchProducts(combinedQuery, filters);

      // Group results by supplier for better display
      const groupedResults = searchResults.reduce((acc, result) => {
        const supplierName = result.supplier;
        if (!acc[supplierName]) {
          acc[supplierName] = [];
        }
        acc[supplierName].push(result);
        return acc;
      }, {} as Record<string, typeof searchResults>);

      // Apply pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string);
      
      console.log(`Search params: page=${pageNum}, limit=${limitNum}, results_total=${searchResults.length}`);

      // If limit is 0, return all results (used for export)
      if (limit === '0') {
        console.log("Returning all results for export");
        return res.json({
          results: searchResults,
          groupedResults,
          totalCount: searchResults.length,
          page: 1,
          limit: searchResults.length,
          totalPages: 1
        });
      }

      const effectiveLimit = limitNum || 50;
      const startIndex = (pageNum - 1) * effectiveLimit;
      const endIndex = startIndex + effectiveLimit;
      const paginatedResults = searchResults.slice(startIndex, endIndex);

      res.json({
        results: paginatedResults,
        groupedResults,
        totalCount: searchResults.length,
        page: pageNum,
        limit: effectiveLimit,
        totalPages: Math.ceil(searchResults.length / effectiveLimit)
      });
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  // Search metadata endpoint for categories and brands
  app.get("/api/search/metadata", async (req, res) => {
    try {
      const results = await storage.searchProducts("", {});

      // Extract unique categories and brands
      const categories = [...new Set(results.map(r => r.category).filter(Boolean))].sort();
      const brands = [...new Set(results.map(r => r.brand).filter(Boolean))].sort();

      res.json({
        categories,
        brands
      });
    } catch (error) {
      console.error("Error fetching search metadata:", error);
      res.status(500).json({ error: "Failed to fetch search metadata" });
    }
  });

  // Refresh search index for a specific price list
  app.post("/api/suppliers/:supplierId/price-lists/:id/refresh-index", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.supplierId);
      const priceListId = parseInt(req.params.id);

      // Get the price list file
      const priceListFiles = await storage.getPriceListFiles(supplierId);
      const priceListFile = priceListFiles.find(f => f.id === priceListId);

      if (!priceListFile) {
        return res.status(404).json({ error: "Price list not found" });
      }

      // Get supplier information
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Read CSV content from Blob URL or local disk (legacy)
      let csvContent: string;
      if (priceListFile.filePath.startsWith("https://")) {
        csvContent = await fetch(priceListFile.filePath).then(r => r.text());
      } else if (fs.existsSync(priceListFile.filePath)) {
        csvContent = fs.readFileSync(priceListFile.filePath, 'utf8');
      } else {
        return res.status(404).json({ error: "Price list file not found" });
      }

      // Clear existing search index entries for this price list
      await storage.deleteSearchIndexBySource('price_list', priceListFile.id);

      // Parse CSV content properly
      const csvLines = csvContent.trim().split('\n');
      const headers = csvLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));
      const csvData = [];

      for (let i = 1; i < csvLines.length; i++) {
        const line = csvLines[i].trim();
        if (!line) continue;

        // Parse CSV line respecting quoted fields
        const values = [];
        let currentField = '';
        let inQuotes = false;
        let j = 0;

        while (j < line.length) {
          const char = line[j];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentField.trim());
            currentField = '';
          } else {
            currentField += char;
          }
          j++;
        }
        values.push(currentField.trim()); // Add the last field

        // Create row object
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        csvData.push(row);
      }



      // Map CSV headers to search index fields
      const headerMap = {
        'Supplier': 'supplier',
        'Category': 'category', 
        'Brand': 'brand',
        'Model': 'model',
        'Product Name': 'productName',
        'Name': 'productName',  // Handle both 'Product Name' and 'Name' headers
        'Price': 'price',
        'Currency': 'currency',
        'Stock': 'stock',
        'MOQ': 'moq',
        'Warranty': 'warranty',
        'Notes': 'notes'
      };

      const searchIndexEntries = [];

      // Process each data row
      for (const row of csvData) {
        const entry = {
          supplierId: supplierId,
          sourceType: 'price_list',
          sourceId: priceListFile.id,
          supplier: supplier.name,
          category: null,
          brand: null,
          model: null,
          productName: null,
          price: null,
          currency: null,
          stock: null,
          moq: null,
          warranty: null,
          notes: null
        };

        // Map CSV values to search index fields
        Object.keys(row).forEach((header) => {
          const fieldName = headerMap[header];
          if (fieldName && row[header]) {
            entry[fieldName] = String(row[header]).trim();
          }
        });

        // Preserve the database supplier name for consistency
        entry.supplier = supplier.name;

        searchIndexEntries.push(entry);
      }

      // Insert search index entries
      if (searchIndexEntries.length > 0) {
        await storage.createSearchIndexEntries(searchIndexEntries);
      }

      res.json({
        success: true,
        message: "Search index refreshed successfully",
        entriesCreated: searchIndexEntries.length
      });

    } catch (error) {
      console.error("Error refreshing search index:", error);
      res.status(500).json({ error: "Failed to refresh search index" });
    }
  });

  // Cost calculation file upload
  app.post("/api/suppliers/:id/cost-calculation", upload.single('file'), async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const blobUrl = await uploadToBlob(`cost-calc/${supplierId}/${Date.now()}-${file.originalname}`, file.buffer, file.mimetype);

      const costFile = await storage.createCostCalculationFile({
        supplierId,
        filename: file.originalname,
        filePath: blobUrl,
      });

      res.status(201).json(costFile);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload cost calculation file" });
    }
  });

  // Categories and brands from supplier data
  app.get("/api/categories/from-suppliers", async (req, res) => {
    try {
      const categories = await storage.getAllCategoriesFromSuppliers();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories from suppliers:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/brands/from-suppliers", async (req, res) => {
    try {
      const brands = await storage.getAllBrandsFromSuppliers();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands from suppliers:", error);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  // Add new category/brand endpoints
  app.post("/api/categories", async (req, res) => {
    try {
      const { category } = req.body;
      if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: "Category is required" });
      }
      // For now, just return success - in a production app, you'd update a database
      res.json({ success: true, category: category.trim() });
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  app.post("/api/brands", async (req, res) => {
    try {
      const { brand } = req.body;
      if (!brand || typeof brand !== 'string') {
        return res.status(400).json({ error: "Brand is required" });
      }
      // For now, just return success - in a production app, you'd update a database
      res.json({ success: true, brand: brand.trim() });
    } catch (error) {
      console.error("Error adding brand:", error);
      res.status(500).json({ error: "Failed to add brand" });
    }
  });

  // Price list file upload routes
  app.post("/api/suppliers/:id/upload-logic", upload.single('logic_file'), async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No logic file uploaded" });
      }

      // Validate file type
      const allowedExtensions = ['.py', '.txt'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ error: "Invalid file type. Only .py and .txt files are allowed." });
      }

      // Store the conversion logic as a Blob
      const blobUrl = await uploadToBlob(`logic/${supplierId}/${Date.now()}-${file.originalname}`, file.buffer, "text/plain");

      // Store the conversion logic in the cost calculation files table for now
      const costFile = await storage.createCostCalculationFile({
        supplierId,
        filename: file.originalname,
        filePath: blobUrl,
      });

      res.status(201).json({ 
        success: true, 
        message: "Conversion logic uploaded successfully",
        file: costFile 
      });
    } catch (error) {
      console.error("Error uploading logic file:", error);
      res.status(500).json({ error: "Failed to upload conversion logic file" });
    }
  });

  app.post("/api/suppliers/:id/upload-price", upload.single('price_file'), async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No price list file uploaded" });
      }

      // Validate file type
      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ error: "Invalid file type. Only .xlsx, .xls, and .csv files are allowed." });
      }

      // Check if conversion logic exists for this supplier
      const conversionLogic = await storage.getCostCalculationFile(supplierId);
      if (!conversionLogic) {
        return res.status(400).json({ error: "No conversion logic found. Please upload conversion logic first." });
      }

      // Read the conversion logic from Vercel Blob (private) or local path
      let logicContent = "";
      try {
        if (conversionLogic.filePath.startsWith("https://")) {
          logicContent = await fetch(conversionLogic.filePath, {
            headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
          }).then(r => r.text());
        } else if (fs.existsSync(conversionLogic.filePath)) {
          logicContent = fs.readFileSync(conversionLogic.filePath, "utf8");
        }
      } catch { /* use empty logic — auto-detect columns */ }

      // Get supplier name for tagging
      const supplierInfo = await storage.getSupplier(supplierId);

      // Process with TypeScript processor (replaces Python)
      const result = processPriceList(file.buffer, fileExtension, logicContent, supplierInfo?.name);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Upload processed CSV to Vercel Blob
      const processedFilename = `${Date.now()}_${result.outputFilename || 'converted_price_list.csv'}`;
      const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
      const contentBuffer = Buffer.from(result.csvContent!, "utf8");
      const finalBuffer = Buffer.concat([utf8BOM, contentBuffer]);
      const blobUrl = await uploadToBlob(`price-lists/${supplierId}/${processedFilename}`, finalBuffer, "text/csv");

      // Store the price list file in database
      const priceListFile = await storage.createPriceListFile({
        supplierId,
        filename: processedFilename,
        originalName: file.originalname,
        filePath: blobUrl,
        fileSize: file.size,
      });

      // Populate search index from processed CSV
      try {
        if (supplierInfo) {
          await storage.deleteSearchIndexBySource('price_list', priceListFile.id);
          const csvLines = result.csvContent!.trim().split('\n');
          const headers = csvLines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));
          const headerMap: Record<string, string> = {
            'Supplier': 'supplier', 'Category': 'category', 'Brand': 'brand',
            'Model': 'model', 'Product Name': 'productName', 'Name': 'productName',
            'Price': 'price', 'Currency': 'currency', 'Stock': 'stock',
            'MOQ': 'moq', 'Warranty': 'warranty', 'Notes': 'notes'
          };
          const searchIndexEntries: any[] = [];
          for (let i = 1; i < csvLines.length; i++) {
            const line = csvLines[i].trim();
            if (!line) continue;
            const values: string[] = [];
            let currentField = '', inQuotes = false;
            for (const char of line) {
              if (char === '"') { inQuotes = !inQuotes; }
              else if (char === ',' && !inQuotes) { values.push(currentField.trim()); currentField = ''; }
              else { currentField += char; }
            }
            values.push(currentField.trim());
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
            const entry: any = {
              supplierId, sourceType: 'price_list', sourceId: priceListFile.id,
              supplier: supplierInfo.name, category: null, brand: null, model: null,
              productName: null, price: null, currency: null, stock: null, moq: null,
              warranty: null, notes: null
            };
            Object.keys(row).forEach(h => {
              const f = headerMap[h];
              if (f && row[h]) entry[f] = String(row[h]).trim();
            });
            searchIndexEntries.push(entry);
          }
          if (searchIndexEntries.length > 0) {
            await storage.createSearchIndexEntries(searchIndexEntries);
          }
        }
      } catch (searchIndexError) {
        console.error("Error populating search index:", searchIndexError);
      }

      res.status(201).json({
        success: true,
        message: "Price list processed successfully",
        file: priceListFile,
        preview_html: result.previewHtml,
        row_count: result.rowCount,
        column_count: result.columnCount,
        columns: result.columns
      });

    } catch (error) {
      console.error("Error uploading price file:", error);
      res.status(500).json({ error: "Failed to upload price list file" });
    }
  });

  // Download processed price list
  app.get("/api/suppliers/:id/download-price/:fileId", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const fileId = parseInt(req.params.fileId);

      const files = await storage.getPriceListFiles(supplierId);
      const file = files.find(f => f.id === fileId);

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      if (!file.filePath) {
        return res.status(404).json({ error: "File no longer available" });
      }

      if (file.filePath.startsWith("https://")) {
        // Proxy from private Vercel Blob store (requires auth token)
        return await proxyBlobDownload(file.filePath, res, file.filename ?? file.originalName ?? "price_list.csv", "text/csv; charset=utf-8");
      }

      // Legacy: local file (pre-migration)
      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({ error: "File no longer exists on disk" });
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      const fileBuffer = fs.readFileSync(file.filePath);
      const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
      res.send(Buffer.concat([utf8BOM, fileBuffer]));
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Document routes
  app.post("/api/suppliers/:id/documents", upload.single('document'), async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No document file uploaded" });
      }

      // Validate file type - allow common document types
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ error: "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, and CSV files are allowed." });
      }

      const blobUrl = await uploadToBlob(`documents/${supplierId}/${Date.now()}-${file.originalname}`, file.buffer, file.mimetype);

      const document = await storage.createDocument({
        supplierId,
        filename: file.originalname,
        originalName: file.originalname,
        filePath: blobUrl,
        fileSize: file.size,
        fileType: file.mimetype,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/suppliers/:id/documents", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const documents = await storage.getDocuments(supplierId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get("/api/suppliers/:id/documents/:documentId/download", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const documentId = parseInt(req.params.documentId);

      const documents = await storage.getDocuments(supplierId);
      const document = documents.find(d => d.id === documentId);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.filePath) {
        return res.status(404).json({ error: "Document file no longer available" });
      }

      if (document.filePath.startsWith("https://")) {
        return await proxyBlobDownload(document.filePath, res, document.originalName ?? "document", document.fileType ?? "application/octet-stream");
      }

      // Legacy: local file
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ error: "Document file no longer exists on disk" });
      }
      res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      fs.createReadStream(document.filePath).pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  app.delete("/api/suppliers/:id/documents/:documentId", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const documentId = parseInt(req.params.documentId);

      const documents = await storage.getDocuments(supplierId);
      const document = documents.find(d => d.id === documentId);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      await deleteFromBlob(document.filePath);
      await storage.deleteDocument(documentId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Add route to delete price list files
  app.delete("/api/suppliers/:id/price-lists/:fileId", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const fileId = parseInt(req.params.fileId);

      const files = await storage.getPriceListFiles(supplierId);
      const file = files.find(f => f.id === fileId);

      if (!file) {
        return res.status(404).json({ error: "Price list file not found" });
      }

      await deleteFromBlob(file.filePath);

      // Delete related search index entries
      await storage.deleteSearchIndexBySource('price_list', fileId);

      // Delete from database
      await storage.deletePriceListFile(fileId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting price list file:", error);
      res.status(500).json({ error: "Failed to delete price list file" });
    }
  });

  // Add route to refresh search index after offer update
  app.post("/api/offers/:id/refresh-search", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);

      // Find the offer directly
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Clear existing search index entries for this offer
      await storage.deleteSearchIndexBySource('offer', offerId);

      // Repopulate search index
      const supplier = await storage.getSupplier(offer.supplierId);
      if (supplier) {
        const offerContent = offer.content || '';
        const lines = offerContent.split('\n').map(line => line.trim()).filter(line => line);

        for (const line of lines) {
          if (line.length > 10) {
            const { cleanedName, price, currency } = extractPriceFromText(line);
            const searchEntry = {
              supplierId: offer.supplierId,
              sourceType: 'offer',
              sourceId: offer.id,
              supplier: supplier.name,
              category: null,
              brand: null,
              model: null,
              productName: cleanedName,
              price: price,
              currency: currency,
              stock: null,
              warranty: null,
              notes: `Source: ${offer.source}`
            };

            await storage.createSearchIndexEntry(searchEntry);
          }
        }
      }

      res.json({ success: true, message: "Search index refreshed for offer" });
    } catch (error) {
      console.error("Error refreshing search index for offer:", error);
      res.status(500).json({ error: "Failed to refresh search index" });
    }
  });

  // Category and brand deletion routes
  app.delete("/api/categories/:categoryName", async (req, res) => {
    try {
      const categoryName = decodeURIComponent(req.params.categoryName);
      await storage.deleteCategoryFromAllSuppliers(categoryName);
      res.json({ success: true, message: `Category "${categoryName}" deleted from all suppliers` });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  app.delete("/api/brands/:brandName", async (req, res) => {
    try {
      const brandName = decodeURIComponent(req.params.brandName);
      await storage.deleteBrandFromAllSuppliers(brandName);
      res.json({ success: true, message: `Brand "${brandName}" deleted from all suppliers` });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ error: "Failed to delete brand" });
    }
  });

  // Database export route
  app.post("/api/export/database", async (req, res) => {
    try {
      console.log("Starting database export...");

      // Get all suppliers for CSV export
      const suppliers = await storage.getAllSuppliersForExport();
      console.log(`Found ${suppliers.length} suppliers`);

      // Get all documents with supplier names
      const documents = await storage.getAllDocumentsForExport();
      console.log(`Found ${documents.length} documents`);

      // Create CSV content for suppliers
      const csvHeader = [
        'ID', 'Name', 'Country', 'Phone', 'Email', 'WhatsApp',
        'Website', 'Categories', 'Brands', 'Working Style', 'Reputation', 'Comments'
      ].join(',') + '\n';

      const csvRows = suppliers.map(supplier => [
        supplier.id,
        `"${(supplier.name || '').replace(/"/g, '""')}"`,
        `"${(supplier.country || '').replace(/"/g, '""')}"`,
        `"${(supplier.phone || '').replace(/"/g, '""')}"`,
        `"${(supplier.email || '').replace(/"/g, '""')}"`,
        `"${(supplier.whatsapp || '').replace(/"/g, '""')}"`,
        `"${(supplier.website || '').replace(/"/g, '""')}"`,
        `"${(supplier.categories || []).join('; ').replace(/"/g, '""')}"`,
        `"${(supplier.brands || []).join('; ').replace(/"/g, '""')}"`,
        `"${(supplier.workingStyle || []).join('; ').replace(/"/g, '""')}"`,
        supplier.reputation || 0,
        `"${(supplier.comments || '').replace(/"/g, '""')}"`,
      ].join(','));

      const csvContent = csvHeader + csvRows.join('\n');

      // Create temporary directory for export
      const exportDir = path.join(os.tmpdir(), 'temp-export');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      // Write CSV file
      const csvFilePath = path.join(exportDir, 'suppliers-data.csv');
      fs.writeFileSync(csvFilePath, csvContent, 'utf8');
      console.log("CSV file created");

      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=database-export-${new Date().toISOString().split('T')[0]}.zip`);

      // Create archive
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to create export archive' });
        }
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add CSV file to archive
      archive.file(csvFilePath, { name: 'suppliers-data.csv' });

      // Organize documents by supplier folders
      const supplierFolders = new Map();

      for (const doc of documents) {
        const supplierName = doc.supplierName.replace(/[^a-zA-Z0-9\s\-_]/g, ''); // Clean folder name
        if (!supplierFolders.has(supplierName)) {
          supplierFolders.set(supplierName, []);
        }
        supplierFolders.get(supplierName).push(doc);
      }

      // Add documents to archive organized by supplier
      for (const [supplierName, docs] of supplierFolders) {
        for (const doc of docs) {
          if (fs.existsSync(doc.filePath)) {
            const folderPath = `supplier-files/${supplierName}/documents`;
            archive.file(doc.filePath, { 
              name: `${folderPath}/${doc.originalName}` 
            });
          }
        }
      }

      // Finalize archive
      await archive.finalize();
      console.log("Archive finalized and sent");

      // Clean up temporary files
      setTimeout(() => {
        try {
          if (fs.existsSync(csvFilePath)) {
            fs.unlinkSync(csvFilePath);
          }
          if (fs.existsSync(exportDir)) {
            fs.rmdirSync(exportDir);
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }, 5000);

    } catch (error) {
      console.error("Database export error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to export database" });
      }
    }
  });

  // CSV parsing helper function
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // CSV Import routes
  app.post("/api/import/preview", upload.single('csv_file'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No CSV file uploaded" });
      }

      // Read and parse CSV
      const csvContent = file.buffer.toString('utf8');
      const lines = csvContent.trim().split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV file must have at least a header and one data row" });
      }

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
      const rows: string[][] = [];
      const errors: string[] = [];

      // Expected headers for validation
      const expectedHeaders = ['ID', 'Name', 'Country', 'Phone', 'Email', 'WhatsApp', 'Website', 'Categories', 'Brands', 'Working Style', 'Reputation', 'Comments'];

      // Check if headers match expected format
      const missingHeaders = expectedHeaders.filter(expected => !headers.includes(expected));
      if (missingHeaders.length > 0) {
        errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      let validRows = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line with proper handling of empty fields
        const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};

        // Ensure we have enough values for all headers
        while (values.length < headers.length) {
          values.push('');
        }

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        rows.push(values);

        // Validate required fields
        if (!row['Name'] || row['Name'].length < 2) {
          errors.push(`Row ${i}: Name is required and must be at least 2 characters`);
          continue;
        }

        if (!row['Country']) {
          errors.push(`Row ${i}: Country is required`);
          continue;
        }

        if (row['Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email'])) {
          errors.push(`Row ${i}: Invalid email format`);
          continue;
        }

        if (row['Reputation'] && (isNaN(Number(row['Reputation'])) || Number(row['Reputation']) < 0 || Number(row['Reputation']) > 10)) {
          errors.push(`Row ${i}: Reputation must be a number between 0 and 10`);
          continue;
        }

        validRows++;
      }

      res.json({
        headers,
        rows: rows.slice(0, 10), // Only return first 10 rows for preview
        errors,
        validRows,
        totalRows: rows.length
      });

    } catch (error) {
      console.error("Preview error:", error);
      res.status(500).json({ error: "Failed to preview CSV file" });
    }
  });

  app.post("/api/import/suppliers", upload.single('csv_file'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No CSV file uploaded" });
      }

      // Read and parse CSV
      const csvContent = file.buffer.toString('utf8');
      const lines = csvContent.trim().split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV file must have at least a header and one data row" });
      }

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
      const suppliersToImport: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line with proper handling of empty fields
        const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};

        // Ensure we have enough values for all headers
        while (values.length < headers.length) {
          values.push('');
        }

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Skip rows without required fields
        if (!row['Name'] || !row['Country']) continue;

        // Convert to supplier object
        const supplierData = {
          name: row['Name'],
          country: row['Country'],
          phone: row['Phone'] || null,
          email: row['Email'] || null,
          whatsapp: row['WhatsApp'] || null,
          website: row['Website'] || null,
          categories: row['Categories'] ? row['Categories'].split(';').map((c: string) => c.trim()).filter((c: string) => c) : [],
          brands: row['Brands'] ? row['Brands'].split(';').map((b: string) => b.trim()).filter((b: string) => b) : [],
          workingStyle: row['Working Style'] ? row['Working Style'].split(';').map((w: string) => w.trim()).filter((w: string) => w) : [],
          reputation: row['Reputation'] && !isNaN(Number(row['Reputation'])) ? Number(row['Reputation']) : null,
          comments: row['Comments'] || null,
        };

        suppliersToImport.push(supplierData);
      }

      console.log(`Prepared ${suppliersToImport.length} suppliers for import:`, suppliersToImport.map(s => ({ name: s.name, email: s.email })));

      // Import suppliers (only new ones)
      const result = await storage.importSuppliers(suppliersToImport);

      // Add debugging info
      console.log('Import result:', result);
      if (result.errors.length > 0) {
        console.log('Import errors:', result.errors);
      }

      res.json(result);

    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import suppliers" });
    }
  });

  // CompStyle API Routes

  // Dashboard stats
  app.get("/api/compstyle/dashboard-stats", async (req, res) => {
    try {
      const stats = await storage.getCompstyleDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Get CompStyle data overview with real data counts
  app.get('/api/compstyle/data-overview', async (req, res) => {
    try {
      const overview = await storage.getCompstyleDataOverview();
      res.json(overview);
    } catch (error) {
      console.error('Error fetching data overview:', error);
      res.status(500).json({ error: 'Failed to fetch data overview' });
    }
  });

  // API endpoints for each data table (20 rows each for Data Overview)
  app.get('/api/compstyle/total-stock', async (req, res) => {
    try {
      const data = await storage.getCompstyleTotalStock();
      res.json(data);
    } catch (error) {
      console.error('Error fetching total stock:', error);
      res.status(500).json({ error: 'Failed to fetch total stock' });
    }
  });

  app.get('/api/compstyle/kievyan-stock', async (req, res) => {
    try {
      const data = await storage.getCompstyleKievyanStock();
      res.json(data);
    } catch (error) {
      console.error('Error fetching Kievyan stock:', error);
      res.status(500).json({ error: 'Failed to fetch Kievyan stock' });
    }
  });

  app.get('/api/compstyle/sevan-stock', async (req, res) => {
    try {
      const data = await storage.getCompstyleSevanStock();
      res.json(data);
    } catch (error) {
      console.error('Error fetching Sevan stock:', error);
      res.status(500).json({ error: 'Failed to fetch Sevan stock' });
    }
  });

  app.get("/api/compstyle/transit", async (req, res) => {
    try {
      const transitData = await storage.getCompstyleTransit();
      res.json(transitData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/compstyle/transit/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Convert orderDate string to Date if provided
      if (updates.orderDate && typeof updates.orderDate === 'string') {
        updates.orderDate = new Date(updates.orderDate);
      }
      // Convert expectedArrival string to Date if provided
      if (updates.expectedArrival && typeof updates.expectedArrival === 'string') {
        updates.expectedArrival = new Date(updates.expectedArrival);
      }

      const updatedItem = await storage.updateCompstyleTransit(id, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating transit item:', error);
      res.status(500).json({ error: 'Failed to update transit item' });
    }
  });

  // Upload document to transit order
  app.post("/api/compstyle/transit/:id/documents", upload.single('document'), async (req, res) => {
    try {
      const transitId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No document file uploaded" });
      }

      // Get current transit item
      const transitData = await db.select().from(compstyleTransit).where(eq(compstyleTransit.id, transitId));
      if (transitData.length === 0) {
        return res.status(404).json({ error: "Transit order not found" });
      }

      const transit = transitData[0];
      const currentDocuments = transit.documents || [];

      const blobUrl = await uploadToBlob(`transit/${transitId}/${Date.now()}-${file.originalname}`, file.buffer, file.mimetype);
      const uniqueFilename = `${Date.now()}-${file.originalname}`;

      const newDocument = {
        filename: uniqueFilename,
        originalName: file.originalname,
        filePath: blobUrl,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocuments = [...currentDocuments, newDocument];

      const [updated] = await db.update(compstyleTransit)
        .set({ documents: updatedDocuments })
        .where(eq(compstyleTransit.id, transitId))
        .returning();

      res.status(201).json(updated);
    } catch (error) {
      console.error("Error uploading transit document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Download transit order document
  app.get("/api/compstyle/transit/:id/documents/:filename", async (req, res) => {
    try {
      const transitId = parseInt(req.params.id);
      const filename = req.params.filename;

      const transitData = await db.select().from(compstyleTransit).where(eq(compstyleTransit.id, transitId));
      if (transitData.length === 0) {
        return res.status(404).json({ error: "Transit order not found" });
      }

      const transit = transitData[0];
      const documents = transit.documents || [];
      const document = documents.find(d => d.filename === filename);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.filePath) {
        return res.status(404).json({ error: "Document file no longer available" });
      }

      if (document.filePath.startsWith("https://")) {
        return await proxyBlobDownload(document.filePath, res, document.originalName ?? filename, "application/octet-stream");
      }

      // Legacy: local file
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ error: "Document file no longer exists on disk" });
      }
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      fs.createReadStream(document.filePath).pipe(res);
    } catch (error) {
      console.error("Error downloading transit document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // Delete transit order document
  app.delete("/api/compstyle/transit/:id/documents/:filename", async (req, res) => {
    try {
      const transitId = parseInt(req.params.id);
      const filename = req.params.filename;

      const transitData = await db.select().from(compstyleTransit).where(eq(compstyleTransit.id, transitId));
      if (transitData.length === 0) {
        return res.status(404).json({ error: "Transit order not found" });
      }

      const transit = transitData[0];
      const documents = transit.documents || [];
      const document = documents.find(d => d.filename === filename);

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      await deleteFromBlob(document.filePath);

      // Remove document from array
      const updatedDocuments = documents.filter(d => d.filename !== filename);

      // Update transit item
      await db.update(compstyleTransit)
        .set({ documents: updatedDocuments })
        .where(eq(compstyleTransit.id, transitId));

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transit document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.get('/api/compstyle/sales-orders', async (req, res) => {
    try {
      const data = await storage.getCompstyleSalesOrders();
      res.json(data);
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      res.status(500).json({ error: 'Failed to fetch sales orders' });
    }
  });

  app.get('/api/compstyle/sales-items', async (req, res) => {
    try {
      const data = await storage.getCompstyleSalesItems();
      res.json(data);
    } catch (error) {
      console.error('Error fetching sales items:', error);
      res.status(500).json({ error: 'Failed to fetch sales items' });
    }
  });

  app.get('/api/compstyle/purchase-orders', async (req, res) => {
    try {
      const data = await storage.getCompstylePurchaseOrders();
      res.json(data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  });

  app.get('/api/compstyle/purchase-items', async (req, res) => {
    try {
      const data = await storage.getCompstylePurchaseItems();
      res.json(data);
    } catch (error) {
      console.error('Error fetching purchase items:', error);
      res.status(500).json({ error: 'Failed to fetch purchase items' });
    }
  });

  app.get('/api/compstyle/total-sales', async (req, res) => {
    try {
      const data = await storage.getCompstyleTotalSales();
      res.json(data);
    } catch (error) {
      console.error('Error fetching total sales:', error);
      res.status(500).json({ error: 'Failed to fetch total sales' });
    }
  });

  app.get('/api/compstyle/total-procurement', async (req, res) => {
    try {
      const data = await storage.getCompstyleTotalProcurement();
      res.json(data);
    } catch (error) {
      console.error('Error fetching total procurement:', error);
      res.status(500).json({ error: 'Failed to fetch total procurement' });
    }
  });

  // Product List endpoints
  app.get('/api/compstyle/product-list', async (req, res) => {
    try {
      const data = await storage.getCompstyleProductList();
      res.json(data);
    } catch (error) {
      console.error('Error fetching product list:', error);
      res.status(500).json({ error: 'Failed to fetch product list' });
    }
  });

  app.post('/api/compstyle/product-list/rebuild', async (req, res) => {
    try {
      const count = await storage.rebuildProductList();
      res.json({ success: true, message: `Product list rebuilt with ${count} unique products`, count });
    } catch (error) {
      console.error('Error rebuilding product list:', error);
      res.status(500).json({ error: 'Failed to rebuild product list' });
    }
  });

  // Phase 1 Analytics endpoints
  app.get('/api/compstyle/analytics/sales-velocity', async (req, res) => {
    try {
      const data = await storage.getCompstyleSalesVelocity();
      res.json(data);
    } catch (error) {
      console.error('Error fetching sales velocity:', error);
      res.status(500).json({ error: 'Failed to fetch sales velocity' });
    }
  });

  app.get('/api/compstyle/analytics/stock-out-risk', async (req, res) => {
    try {
      const data = await storage.getCompstyleStockOutRisk();
      res.json(data);
    } catch (error) {
      console.error('Error fetching stock-out risk:', error);
      res.status(500).json({ error: 'Failed to fetch stock-out risk' });
    }
  });

  app.get('/api/compstyle/analytics/dead-stock', async (req, res) => {
    try {
      const data = await storage.getCompstyleDeadStock();
      res.json(data);
    } catch (error) {
      console.error('Error fetching dead stock:', error);
      res.status(500).json({ error: 'Failed to fetch dead stock' });
    }
  });

  app.get('/api/compstyle/analytics/profitability-heat-map', async (req, res) => {
    try {
      const data = await storage.getProfitabilityHeatMap();
      res.json(data);
    } catch (error) {
      console.error('Error fetching profitability heat map:', error);
      res.status(500).json({ error: 'Failed to fetch profitability heat map' });
    }
  });

  // Phase 2 Analytics endpoints
  app.get('/api/compstyle/analytics/supplier-performance', async (req, res) => {
    try {
      const data = await storage.getSupplierPerformanceMatrix();
      res.json(data);
    } catch (error) {
      console.error('Error fetching supplier performance:', error);
      res.status(500).json({ error: 'Failed to fetch supplier performance' });
    }
  });

  app.get('/api/compstyle/analytics/location-optimization', async (req, res) => {
    try {
      const data = await storage.getLocationOptimization();
      res.json(data);
    } catch (error) {
      console.error('Error fetching location optimization:', error);
      res.status(500).json({ error: 'Failed to fetch location optimization' });
    }
  });

  app.get('/api/compstyle/analytics/order-recommendations', async (req, res) => {
    try {
      const data = await storage.getOrderRecommendationsEngine();
      res.json(data);
    } catch (error) {
      console.error('Error fetching order recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch order recommendations' });
    }
  });

  app.patch('/api/compstyle/product-list/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedProduct = await storage.updateCompstyleProductList(id, updates);
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.post('/api/compstyle/product-list/batch-save', async (req, res) => {
    try {
      const { changes } = req.body;
      const results = [];

      for (const [productId, updates] of Object.entries(changes)) {
        const id = parseInt(productId);
        const updateData = updates as any;

        // Calculate actual cost if actual price is provided
        if (updateData.actualPrice) {
          const actualPriceNum = parseFloat(updateData.actualPrice);
          if (!isNaN(actualPriceNum)) {
            updateData.actualCost = (actualPriceNum * 0.85).toFixed(2); // Example calculation: 85% of actual price
          }
        }

        const updatedProduct = await storage.updateCompstyleProductList(id, updateData);
        results.push(updatedProduct);
      }

      res.json({ success: true, updatedCount: results.length, products: results });
    } catch (error) {
      console.error('Error batch saving products:', error);
      res.status(500).json({ error: 'Failed to batch save products' });
    }
  });

  app.get('/api/compstyle/product-list/export-csv', async (req, res) => {
    try {
      // Set headers for file download first
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="product-list-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Transfer-Encoding', 'chunked');

      // Add UTF-8 BOM for proper Excel compatibility
      res.write('\uFEFF');

      // Define CSV headers (all columns)
      const headers = [
        'ID', 'SKU', 'Product Name', 'Stock', 'Transit', 'Retail USD', 'Retail AMD', 
        'Dealer 1', 'Dealer 2', 'Cost', 'Latest Purchase', 'Latest Cost', 
        'Avg Sales', 'Actual Price', 'Actual Cost', 'Supplier', 'Last Updated'
      ];

      // Write headers
      res.write(headers.join(',') + '\n');

      // Stream products in smaller chunks to avoid memory issues
      const chunkSize = 100;
      let offset = 0;
      let hasMore = true;
      let totalProcessed = 0;

      while (hasMore) {
        // Fetch chunk directly from database with pagination
        const chunk = await storage.getCompstyleProductListPaginated(chunkSize, offset);

        if (chunk.length === 0) {
          hasMore = false;
          break;
        }

        // Build CSV rows for this chunk
        const csvRows: string[] = [];
        for (const product of chunk) {
          const row = [
            product.id,
            product.sku || '',
            `"${(product.productName || '').replace(/"/g, '""')}"`,
            product.stock || 0,
            product.transit || 0,
            product.retailPriceUsd || '',
            product.retailPriceAmd || '',
            product.dealerPrice1 || '',
            product.dealerPrice2 || '',
            product.cost || '',
            product.latestPurchase || '',
            product.latestCost || '',
            product.aveSalesPrice || '',
            product.actualPrice || '',
            product.actualCost || '',
            product.supplier || '',
            product.lastUpdated
          ];
          csvRows.push(row.join(','));
        }

        // Write chunk to response stream
        res.write(csvRows.join('\n') + '\n');

        totalProcessed += chunk.length;
        offset += chunkSize;

        // Clear the chunk from memory
        csvRows.length = 0;

        // If we got fewer products than the chunk size, we're done
        if (chunk.length < chunkSize) {
          hasMore = false;
        }
      }

      console.log(`CSV export completed: ${totalProcessed} products exported`);
      res.end();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to export CSV' });
      } else {
        res.end();
      }
    }
  });

  // CompStyle file upload endpoint
  app.post("/api/compstyle/upload", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const fileType = req.body.fileType;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!fileType) {
        return res.status(400).json({ error: "File type is required" });
      }

      // Process Excel file
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header row handling
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log("Parsed data rows:", rawData.length);

      let processedCount = 0;

      try {
        switch (fileType) {
          case "total-stock":
            processedCount = await processTotalStockFile(rawData);
            break;
          case "stock-kievyan":
            processedCount = await processLocationStockFile(rawData, "Kievyan");
            break;
          case "stock-sevan":
            processedCount = await processLocationStockFile(rawData, "Sevan");
            break;
          case "in-transit":
            processedCount = await processTransitFile(rawData);
            break;
          case "sale-sevan":
            processedCount = await processSalesByLocationFile(rawData, "Sevan", file.originalname);
            break;
          case "sale-kievyan":
            processedCount = await processSalesByLocationFile(rawData, "Kievyan", file.originalname);
            break;
          case "purchase-sevan":
            processedCount = await processPurchasesByLocationFile(rawData, "Sevan", file.originalname);
            break;
          case "purchase-kievyan":
            processedCount = await processPurchasesByLocationFile(rawData, "Kievyan", file.originalname);
            break;
          case "total-sales":
            processedCount = await processTotalSalesFile(rawData, file.originalname);
            break;
          case "total-procurement":
            processedCount = await processTotalProcurementFile(rawData, file.originalname);
            break;
          default:
            return res.status(400).json({ error: "Invalid file type" });
        }

        res.json({
          success: true,
          message: `File processed successfully`,
          recordsProcessed: processedCount,
          fileType,
          originalName: file.originalname
        });

      } catch (processingError) {
        throw processingError;
      }

    } catch (error) {
      console.error("CompStyle upload error:", error);
      res.status(500).json({ error: "Failed to process CompStyle file" });
    }
  });

  // Helper functions for processing different file types
  // Process Total Stock Current file according to specifications
  async function processTotalStockFile(data: any[]): Promise<number> {
    console.log('Processing Total Stock file - clearing existing data...');

    // Clear existing total stock data before processing new file
    await db.delete(compstyleTotalStock);

    let count = 0;
    // Start from row 1 (skip header row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if no product name (Column B) or SKU (Column J)
      if (!row[1] || !row[9]) continue;

      // Skip header rows
      if (shouldIgnoreRow(row)) continue;

      // Validate required numeric fields
      const qtyInStock = parseNumericValue(row[2]);
      if (qtyInStock === null) continue;

      await storage.createCompstyleTotalStock({
        productName: String(row[1]), // Column B (Марка): Name of product
        sku: String(row[9]), // Column J (КодТовара): Unique internal SKU
        qtyInStock, // Column C (НаСкладе): Quantity of product in stock
        retailPriceUsd: row[3] ? String(parseNumericValue(row[3]) || 0) : null, // Column D (Цена): Actual retail price in USD
        retailPriceAmd: row[4] ? String(parseNumericValue(row[4]) || 0) : null, // Column E (ЦенаПрайса): Actual retail price in AMD
        wholesalePrice1: row[5] ? String(parseNumericValue(row[5]) || 0) : null, // Column F (Диллерская цена1): For qty < 5
        wholesalePrice2: row[6] ? String(parseNumericValue(row[6]) || 0) : null, // Column G (Диллерская цена2): For qty >= 5
        currentCost: row[7] ? String(parseNumericValue(row[7]) || 0) : null, // Column H (ЦенаНаНас): Current actual cost
      });
      count++;
    }
    return count;
  }

  // Process Stock Kievyan/Sevan Current files according to specifications
  async function processLocationStockFile(data: any[], locationName: string): Promise<number> {
    console.log(`Processing ${locationName} Stock file - clearing existing data...`);

    // Clear existing location stock data before processing new file
    if (locationName === "Kievyan") {
      await db.delete(compstyleKievyanStock);
    } else if (locationName === "Sevan") {
      await db.delete(compstyleSevanStock);
    }

    // Get or create location
    const locations = await storage.getCompstyleLocations();
    let location = locations.find(l => l.name.includes(locationName));

    if (!location) {
      location = await storage.createCompstyleLocation({
        name: locationName === "Kievyan" ? "Kievyan 11" : "Sevan 5",
        type: locationName === "Kievyan" ? "retail" : "warehouse"
      });
    }

    let count = 0;
    // Cell A1: Shows date of the report
    const reportDate = data[0] && data[0][0] ? new Date(data[0][0]) : new Date();

    // Starting from second row (skip header row and B2 which can be ignored)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if no product name (Column A) or quantity (Column B)
      if (!row[0] || !row[1]) continue;

      // Skip header rows and special cells
      if (shouldIgnoreRow(row)) continue;

      // Validate numeric data
      const qty = parseNumericValue(row[1]);
      const retailPriceAmd = parseNumericValue(row[2]);

      if (qty === null) continue; // Skip if quantity is not valid

      if (locationName === "Kievyan") {
        await storage.createCompstyleKievyanStock({
          productName: String(row[0]), // Column A (КодТовара): Name of product
          qty, // Column B (Остаток): Quantity of product in stock
          retailPriceAmd: retailPriceAmd ? String(retailPriceAmd) : null, // Column C (БухЦена): Actual retail price in AMD
        });
      } else {
        await storage.createCompstyleSevanStock({
          productName: String(row[0]), // Column A (КодТовара): Name of product
          qty, // Column B (Остаток): Quantity of product in stock
          retailPriceAmd: retailPriceAmd ? String(retailPriceAmd) : null, // Column C (БухЦена): Actual retail price in AMD
        });
      }
      count++;
    }
    return count;
  }

  // Helper function to extract period from filename
  function extractPeriodFromFilename(filename: string): { periodStart: string, periodEnd: string } {
    // Extract date range from filename like "Sale by Sevan 20-08-25 to 25-08-25.xlsx"
    const match = filename.match(/(\d{2}-\d{2}-\d{2})\s+to\s+(\d{2}-\d{2}-\d{2})/);
    if (match) {
      return { periodStart: `20${match[1]}`, periodEnd: `20${match[2]}` };
    }
    // Default fallback
    return { periodStart: "2025-08-20", periodEnd: "2025-08-25" };
  }

  // Helper function to parse numeric values safely
  function parseNumericValue(value: any): number | null {
    if (!value || value === '' || value === undefined || value === null) return null;
    const str = String(value).replace(/,/g, '.'); // Handle comma decimal separators
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  // Helper function to safely parse Excel date values
  function parseExcelDate(value: any): Date | null {
    if (!value) return null;

    // If it's already a Date object
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      // Excel stores dates as days since 1900-01-01 (with leap year bug)
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return isNaN(date.getTime()) ? null : date;
    }

    // If it's a string, check for Russian date format (e.g., "28-окт-2025")
    if (typeof value === 'string') {
      const russianMonths: Record<string, number> = {
        'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
        'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
      };

      // Match format: "28-окт-2025" or "28-окт-25"
      const russianDateMatch = value.match(/^(\d{1,2})-([а-я]{3})-(\d{2,4})$/i);
      if (russianDateMatch) {
        const day = parseInt(russianDateMatch[1], 10);
        const monthKey = russianDateMatch[2].toLowerCase();
        let year = parseInt(russianDateMatch[3], 10);

        // Handle 2-digit year
        if (year < 100) {
          year += 2000;
        }

        const month = russianMonths[monthKey];
        if (month !== undefined) {
          const date = new Date(year, month, day);
          return isNaN(date.getTime()) ? null : date;
        }
      }
    }

    // Try to parse as string with default Date constructor
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // Helper function to check if row should be ignored (Russian headers or special cells)
  function shouldIgnoreRowForOrders(row: any[]): boolean {
    if (!row) return true;
    // For order processing, only skip if the entire row is empty
    return row.every(cell => !cell || String(cell).trim() === '');
  }

  function shouldIgnoreRow(row: any[]): boolean {
    if (!row || !row[0]) return true;
    const cellA = String(row[0]).toLowerCase();
    // Skip only specific header labels and special cells mentioned in instructions
    return cellA.includes('поле63:') || cellA.includes('поле46:') || 
           cellA.includes('text84:') || cellA.includes('text88:') ||
           cellA === 'марка' || cellA === 'кодтовара' || cellA === 'товар'; // Only exact matches for headers
  }

  // Process In Transit Current file according to specifications
  async function processTransitFile(data: any[]): Promise<number> {
    console.log('Processing Transit file with sync logic...');

    // Get existing transit records
    const existingRecords = await db.select().from(compstyleTransit);
    const existingByOrderNumber = new Map<string, any>();

    // Only track records that have a purchase order number
    for (const record of existingRecords) {
      if (record.purchaseOrderNumber) {
        existingByOrderNumber.set(record.purchaseOrderNumber, record);
      }
    }

    let count = 0;
    const processedOrderNumbers = new Set<string>(); // Track order numbers in uploaded file
    const newRecordsToInsert: any[] = []; // Collect new records to insert

    // Start from row 1 (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if no product name (Column A) or quantity (Column B)
      if (!row[0] || !row[1]) continue;

      // Skip header rows and special cells
      if (shouldIgnoreRow(row)) continue;

      // Validate required numeric fields
      const qty = parseNumericValue(row[1]);
      if (qty === null) {
        console.log(`Row ${i}: Skipping - invalid quantity: ${row[1]}`);
        continue;
      }

      const productName = String(row[0]).trim();
      const purchaseOrderNumber = row[9] ? String(row[9]).trim() : null;

      // Parse optional numeric fields
      const purchasePriceUsd = parseNumericValue(row[2]);
      const purchasePriceAmd = parseNumericValue(row[3]);
      const currentCost = parseNumericValue(row[6]);

      const orderDate = parseExcelDate(row[16]); // Column Q (Дата заказа): Order date
      const expectedArrival = parseExcelDate(row[17]); // Column R (Expected arrival): Expected arrival date

      // Only process records that have a purchase order number
      if (!purchaseOrderNumber) {
        console.log(`Row ${i}: Skipping - no purchase order number for product: ${productName.substring(0, 50)}...`);
        continue;
      }

      // Check if this order number already exists
      if (existingByOrderNumber.has(purchaseOrderNumber)) {
        // Order exists - skip it, keep existing data
        console.log(`Skipping existing order: ${purchaseOrderNumber} for product: ${productName.substring(0, 50)}...`);
        processedOrderNumbers.add(purchaseOrderNumber);
        continue;
      }

      // Track this order number as processed
      processedOrderNumbers.add(purchaseOrderNumber);

      // This is a new order - prepare for insertion
      const transitRecord = {
        productName, // Column A (Товар): Name of product
        qty, // Column B (Кол.): Quantity purchased
        purchasePriceUsd: purchasePriceUsd ? String(purchasePriceUsd) : null, // Column C (Цена $): Purchasing price in USD
        purchasePriceAmd: purchasePriceAmd ? String(purchasePriceAmd) : null, // Column D (Цена AMD): Purchasing price in AMD
        currentCost: currentCost ? String(currentCost) : null, // Column G (Уч. цена): Current actual cost
        purchaseOrderNumber: purchaseOrderNumber, // Column J (Связь): Purchase Order Number
        destinationLocation: row[14] ? String(row[14]) : null, // Column O (Склад): Destination warehouse/store
        supplier: row[15] ? String(row[15]) : null, // Column P (Поставщик): Supplier name
        orderDate: orderDate, // Column Q (Дата заказа): Order date
        expectedArrival: expectedArrival, // Column R: Expected arrival date
        status: 'ordered',
        priority: 'normal',
        notes: null,
      };

      newRecordsToInsert.push(transitRecord);
    }

    // Insert all new records
    for (const record of newRecordsToInsert) {
      await storage.createCompstyleTransit(record);
      count++;
    }

    console.log(`Transit file processed: ${count} new orders added`);

    // Delete orders that exist in DB but not in the uploaded file (only those with purchase order numbers)
    const orderNumbersToDelete: string[] = [];
    for (const [orderNumber, record] of existingByOrderNumber) {
      if (!processedOrderNumbers.has(orderNumber)) {
        orderNumbersToDelete.push(orderNumber);
        console.log(`Order ${orderNumber} not in file - will delete all items for this order`);
      }
    }

    // Delete all records with these order numbers (all products in each order)
    let totalDeletedItems = 0;
    for (const orderNumber of orderNumbersToDelete) {
      // Find all records to delete for this order
      const recordsToDelete = existingRecords.filter(r => r.purchaseOrderNumber === orderNumber);

      // Delete Blob documents for all records in this order
      for (const record of recordsToDelete) {
        if (record.documents && Array.isArray(record.documents)) {
          for (const doc of record.documents) {
            if (doc.filePath) await deleteFromBlob(doc.filePath);
          }
        }
        console.log(`Will delete item: ${record.productName.substring(0, 50)}... from order ${orderNumber}`);
      }

      // Delete ALL records with this order number in a single query
      const deletedCount = await db.delete(compstyleTransit)
        .where(eq(compstyleTransit.purchaseOrderNumber, orderNumber));

      totalDeletedItems += recordsToDelete.length;
      console.log(`Deleted ${recordsToDelete.length} items from order ${orderNumber}`);
    }

    console.log(`Transit sync complete: ${count} new orders added, ${orderNumbersToDelete.length} orders deleted (${totalDeletedItems} total items)`);
    return count;
  }

  // Process Sales by Location files according to specifications (block-based structure)
  async function processSalesByLocationFile(data: any[], location: string, filename: string): Promise<number> {
    let count = 0;
    console.log(`Processing sales file for ${location}, total rows: ${data.length}`);

    // Extract period from filename
    const { periodStart, periodEnd } = extractPeriodFromFilename(filename);

    // Process starting from row 2 (skip irrelevant row 0 and header row 1)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];

      // Check if this row contains a sales order number in Column A
      if (row[0] && /^\d{6}$/.test(String(row[0]))) {
        const salesOrderNumber = String(row[0]); // Column A
        const orderDate = parseExcelDate(row[1]) || new Date(); // Column B
        const customer = row[2] ? String(row[2]) : null; // Column C
        const contactName = row[3] ? String(row[3]) : null; // Column D

        console.log(`Found Sales Order: ${salesOrderNumber}, Customer: ${customer}`);

        const orderLineItems: any[] = [];

        // Look for product data in the rows following this order header
        let j = i + 1;
        while (j < data.length) {
          const productRow = data[j];

          // Stop if we hit an empty row or another order number
          if (!productRow || productRow.every(cell => !cell || String(cell).trim() === '') || 
              (productRow[0] && /^\d{6}$/.test(String(productRow[0])))) {
            break;
          }

          // Extract product data from exact columns K, L, M
          const productName = productRow[10] ? String(productRow[10]) : null; // Column K
          const priceUsd = parseNumericValue(productRow[11]); // Column L
          const qty = parseNumericValue(productRow[12]); // Column M

          console.log(`Row ${j} - K: "${productName}", L: ${priceUsd}, M: ${qty}`);

          // Add product if all required data is present
          if (productName && productName.length > 5 && priceUsd !== null && qty !== null && qty > 0) {
            const sumUsd = priceUsd * qty;
            orderLineItems.push({
              productName,
              priceUsd: String(priceUsd),
              qty: Math.round(qty),
              sumUsd: String(sumUsd),
            });
            console.log(`✓ Added product: ${productName.substring(0, 30)}... $${priceUsd} x ${qty} = $${sumUsd}`);
          }

          j++;
        }

        // Save the order with its line items
        if (orderLineItems.length > 0) {
          const orderData = {
            salesOrderNumber,
            orderDate,
            customer,
            contactName,
            location,
            totalAmountUsd: String(orderLineItems.reduce((sum, item) => sum + parseFloat(item.sumUsd), 0)),
            periodStart,
            periodEnd,
          };

          try {
            const orderInDb = await storage.createCompstyleSalesOrder(orderData);
            for (const item of orderLineItems) {
              await storage.createCompstyleSalesItem({
                ...item,
                salesOrderId: orderInDb.id
              });
            }
            count++;
            console.log(`✓ Saved sales order ${salesOrderNumber} with ${orderLineItems.length} items`);
          } catch (err: any) {
            if (err.code === '23505') { // Unique constraint violation
              console.log(`Skipping existing sales order: ${salesOrderNumber}`);
            } else {
              throw err;
            }
          }
        }

        // Skip to the row we processed last
        i = j - 1;
      }
    }

    console.log(`Sales processing complete: ${count} orders saved`);
    return count;
  }

  async function processPurchasesByLocationFile(data: any[], location: string, filename: string): Promise<number> {
    let count = 0;
    console.log(`Processing purchase file for ${location}, total rows: ${data.length}`);

    // Extract period from filename
    const { periodStart, periodEnd } = extractPeriodFromFilename(filename);

    // Process starting from row 2 (skip irrelevant row 0 and header row 1)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];

      // Check if this row contains a purchase order number in Column A
      if (row[0] && /^\d{6}$/.test(String(row[0]))) {
        const purchaseOrderNumber = String(row[0]); // Column A
        const orderDate = parseExcelDate(row[1]) || new Date(); // Column B
        const supplier = row[2] ? String(row[2]) : null; // Column C
        const contactName = row[3] ? String(row[3]) : null; // Column D

        console.log(`Found Purchase Order: ${purchaseOrderNumber}, Supplier: ${supplier}`);

        const orderLineItems: any[] = [];

        // Look for product data in the rows following this order header
        let j = i + 1;
        while (j < data.length) {
          const productRow = data[j];

          // Stop if we hit an empty row or another order number
          if (!productRow || productRow.every(cell => !cell || String(cell).trim() === '') || 
              (productRow[0] && /^\d{6}$/.test(String(productRow[0])))) {
            break;
          }

          // Extract product data from exact columns K, L, M
          const productName = productRow[10] ? String(productRow[10]) : null; // Column K
          const priceUsd = parseNumericValue(productRow[11]); // Column L
          const qty = parseNumericValue(productRow[12]); // Column M

          console.log(`Purchase Row ${j} - K: "${productName}", L: ${priceUsd}, M: ${qty}`);

          // Add product if all required data is present
          if (productName && productName.length > 5 && priceUsd !== null && qty !== null && qty > 0) {
            const sumUsd = priceUsd * qty;
            orderLineItems.push({
              productName,
              priceUsd: String(priceUsd),
              qty: Math.round(qty),
              sumUsd: String(sumUsd),
            });
            console.log(`✓ Added purchase product: ${productName.substring(0, 30)}... $${priceUsd} x ${qty} = $${sumUsd}`);
          }

          j++;
        }

        // Save the order with its line items
        if (orderLineItems.length > 0) {
          const orderData = {
            purchaseOrderNumber,
            orderDate,
            supplier,
            contactName,
            location,
            totalAmountUsd: String(orderLineItems.reduce((sum, item) => sum + parseFloat(item.sumUsd), 0)),
            periodStart,
            periodEnd,
          };

          try {
            const orderInDb = await storage.createCompstylePurchaseOrder(orderData);
            for (const item of orderLineItems) {
              await storage.createCompstylePurchaseItem({
                ...item,
                purchaseOrderId: orderInDb.id
              });
            }
            count++;
            console.log(`✓ Saved purchase order ${purchaseOrderNumber} with ${orderLineItems.length} items`);
          } catch (err: any) {
            if (err.code === '23505') { // Unique constraint violation
              console.log(`Skipping existing purchase order: ${purchaseOrderNumber}`);
            } else {
              throw err;
            }
          }
        }

        // Skip to the row we processed last
        i = j - 1;
      }
    }

    console.log(`Purchase processing complete: ${count} orders saved`);
    return count;
  }

  // Process Total sales by goods files according to specifications
  async function processTotalSalesFile(data: any[], filename: string): Promise<number> {
    console.log('Processing Total Sales file - clearing existing data...');

    // Clear existing total sales data before processing new file
    await db.delete(compstyleTotalSales);

    // Extract period from filename
    const { periodStart, periodEnd } = extractPeriodFromFilename(filename);

    // Aggregate sales by product name (to handle duplicates in the same file)
    const productSalesMap = new Map<string, {
      qtySold: number;
      totalRevenue: number;
      totalCost: number;
    }>();

    // Start from row 2 (skip header rows 0 and 1)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];

      // Skip if no product name (Column B) or quantity (Column E)
      if (!row[1] || !row[4]) continue;

      // Skip header rows and special cells (Text84:, Text88:)
      if (shouldIgnoreRow(row)) continue;

      // Validate required numeric fields
      const qtySold = parseNumericValue(row[4]); // Column E (Количество): Quantity sold
      const salePriceUsd = parseNumericValue(row[5]); // Column F (Цена): Price in USD sold for
      const costPriceUsd = parseNumericValue(row[6]); // Column G (Учетная цена): Cost in USD

      if (qtySold === null || qtySold <= 0) continue;

      const safeSalePrice = salePriceUsd || 0;
      const safeCostPrice = costPriceUsd || 0;
      const productName = String(row[1]).trim();

      // Aggregate data for this product
      const existing = productSalesMap.get(productName) || {
        qtySold: 0,
        totalRevenue: 0,
        totalCost: 0
      };

      existing.qtySold += qtySold;
      existing.totalRevenue += safeSalePrice * qtySold;
      existing.totalCost += safeCostPrice * qtySold;

      productSalesMap.set(productName, existing);
    }

    // Insert aggregated data
    let count = 0;
    for (const [productName, data] of productSalesMap) {
      const avgSalePrice = data.qtySold > 0 ? data.totalRevenue / data.qtySold : 0;
      const avgCostPrice = data.qtySold > 0 ? data.totalCost / data.qtySold : 0;

      await storage.createCompstyleTotalSales({
        productName,
        qtySold: data.qtySold,
        salePriceUsd: String(avgSalePrice.toFixed(2)),
        costPriceUsd: String(avgCostPrice.toFixed(2)),
        profitPerUnit: String((avgSalePrice - avgCostPrice).toFixed(2)),
        totalProfit: String((data.totalRevenue - data.totalCost).toFixed(2)),
        periodStart,
        periodEnd,
      });
      count++;
    }

    console.log(`Total Sales processed: ${count} unique products saved`);
    return count;
  }

  // Process Total procurement by goods files according to specifications
  async function processTotalProcurementFile(data: any[], filename: string): Promise<number> {
    console.log('Processing Total Procurement file - clearing existing data...');

    // Clear existing total procurement data before processing new file
    await db.delete(compstyleTotalProcurement);

    // Extract period from filename
    const { periodStart, periodEnd } = extractPeriodFromFilename(filename);

    // Aggregate procurement by product name (to handle duplicates in the same file)
    const productProcurementMap = new Map<string, {
      qtyPurchased: number;
      totalCost: number;
    }>();

    // Start from row 1 (skip header row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip if no product name (Column B) or quantity (Column E)
      if (!row[1] || !row[4]) continue;

      // Skip header rows and special cells (Text84:, Text88:)
      if (shouldIgnoreRow(row)) continue;

      // Validate required numeric fields
      const qtyPurchased = parseNumericValue(row[4]); // Column E (Количество): Quantity purchased
      const purchasePriceUsd = parseNumericValue(row[5]); // Column F (Цена): Purchase price in USD

      if (qtyPurchased === null || qtyPurchased <= 0) continue;

      const safePurchasePrice = purchasePriceUsd || 0;
      const productName = String(row[1]).trim();

      // Aggregate data for this product
      const existing = productProcurementMap.get(productName) || {
        qtyPurchased: 0,
        totalCost: 0
      };

      existing.qtyPurchased += qtyPurchased;
      existing.totalCost += safePurchasePrice * qtyPurchased;

      productProcurementMap.set(productName, existing);
    }

    // Insert aggregated data
    let count = 0;
    for (const [productName, data] of productProcurementMap) {
      const avgPurchasePrice = data.qtyPurchased > 0 ? data.totalCost / data.qtyPurchased : 0;

      await storage.createCompstyleTotalProcurement({
        productName,
        qtyPurchased: data.qtyPurchased,
        purchasePriceUsd: avgPurchasePrice > 0 ? String(avgPurchasePrice.toFixed(2)) : null,
        periodStart,
        periodEnd,
      });
      count++;
    }

    console.log(`Total Procurement processed: ${count} unique products saved`);
    return count;
  }

  // Inventory Movement API
  app.get("/api/compstyle/inventory-movement", async (req, res) => {
    try {
      const recommendations = await storage.getInventoryMovementRecommendations();
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error fetching inventory movement:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // CompStyle Product Search API
  app.get("/api/compstyle/product-search", async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const searchQuery = query.trim();
      const searchQueryLower = searchQuery.toLowerCase();
      const results = [];

      // Get all CompStyle data sources
      const totalStock = await storage.getCompstyleTotalStock();
      const totalSales = await storage.getCompstyleTotalSales();
      const transitData = await storage.getCompstyleTransit();

      // Build a set of unique product names that actually exist in CompStyle
      const compstyleProducts = new Set<string>();

      totalStock.forEach(item => compstyleProducts.add(item.productName));
      totalSales.forEach(item => compstyleProducts.add(item.productName));
      transitData.forEach(item => compstyleProducts.add(item.productName));

      console.log(`Product Search: Searching for "${searchQuery}" in ${compstyleProducts.size} total products`);

      // Debug: Check if the specific product exists in any source table
      const debugProductName = "Модуль памяти DIMM 32GB DDR4 PATRIOT PSD432G3200K Kit (2x16GB, 3200MHz, 1.2v)";
      if (searchQuery.includes("PATRIOT PSD432G3200K")) {
        console.log(`\n=== DEBUG: Searching for PATRIOT product ===`);
        console.log(`Total Stock contains: ${totalStock.some(p => p.productName.includes("PATRIOT PSD432G3200K"))}`);
        console.log(`Total Sales contains: ${totalSales.some(p => p.productName.includes("PATRIOT PSD432G3200K"))}`);
        console.log(`Transit contains: ${transitData.some(p => p.productName.includes("PATRIOT PSD432G3200K"))}`);

        // Check exact match
        const exactInStock = totalStock.find(p => p.productName === debugProductName);
        const exactInSales = totalSales.find(p => p.productName === debugProductName);
        const exactInTransit = transitData.find(p => p.productName === debugProductName);

        console.log(`Exact match in Total Stock: ${exactInStock ? 'YES' : 'NO'}`);
        console.log(`Exact match in Total Sales: ${exactInSales ? 'YES' : 'NO'}`);
        console.log(`Exact match in Transit: ${exactInTransit ? 'YES' : 'NO'}`);

        if (exactInStock) console.log(`Stock product name: "${exactInStock.productName}"`);
        if (exactInSales) console.log(`Sales product name: "${exactInSales.productName}"`);
        if (exactInTransit) console.log(`Transit product name: "${exactInTransit.productName}"`);

        console.log(`=== END DEBUG ===\n`);
      }

      // Filter to only search CompStyle products that match the query
      // Use case-insensitive search and also try trimming whitespace
      const matchingProducts = Array.from(compstyleProducts).filter(productName => {
        const productNameLower = productName.toLowerCase().trim();
        const queryLower = searchQueryLower.trim();

        // Try exact match first (case-insensitive)
        if (productNameLower === queryLower) {
          return true;
        }

        // Then try partial match
        return productNameLower.includes(queryLower);
      });

      console.log(`Product Search: Found ${matchingProducts.length} matching products`);

      // Get additional data for matching products
      const profitabilityData = await storage.getProfitabilityHeatMap();
      const kievyanStock = await storage.getCompstyleKievyanStock();
      const sevanStock = await storage.getCompstyleSevanStock();
      const orderRecommendations = await storage.getOrderRecommendationsEngine();

      // Get all purchase data to find last purchase price and supplier
      const purchaseOrders = await storage.getCompstylePurchaseOrders();
      const purchaseItems = await storage.getCompstylePurchaseItems();

      console.log(`Product Search: Processing ${matchingProducts.length} matching products...`);

      for (const productName of matchingProducts) {
        const stockData = totalStock.find((s: any) => s.productName === productName);
        const profitData = profitabilityData.find((p: any) => p.productName === productName);
        const orderRec = orderRecommendations.find((o: any) => o.productName === productName);

        const kievyan = kievyanStock
          .filter((k: any) => k.productName === productName)
          .reduce((sum, item) => sum + item.qty, 0) || 0;

        const sevan = sevanStock
          .filter((s: any) => s.productName === productName)
          .reduce((sum, item) => sum + item.qty, 0) || 0;

        const transit = transitData
          .filter((t: any) => t.productName === productName)
          .reduce((sum, item) => sum + (item.qty || 0), 0) || 0;

        // Find the most recent purchase for this product
        const productPurchaseItems = purchaseItems
          .filter((item: any) => item.productName === productName)
          .sort((a: any, b: any) => {
            const orderA = purchaseOrders.find((o: any) => o.id === a.purchaseOrderId);
            const orderB = purchaseOrders.find((o: any) => o.id === b.purchaseOrderId);
            if (!orderA || !orderB) return 0;
            return new Date(orderB.orderDate).getTime() - new Date(orderA.orderDate).getTime();
          });

        let lastPrice = null;
        let lastSupplier = null;

        if (productPurchaseItems.length > 0) {
          const latestPurchaseItem = productPurchaseItems[0];
          lastPrice = latestPurchaseItem.priceUsd ? parseFloat(latestPurchaseItem.priceUsd) : null;

          const latestPurchaseOrder = purchaseOrders.find((o: any) => o.id === latestPurchaseItem.purchaseOrderId);
          lastSupplier = latestPurchaseOrder?.supplier || null;
        }

        results.push({
          productName: productName,
          stock: stockData?.qtyInStock || 0,
          transit: transit,
          retailPriceUsd: stockData?.retailPriceUsd ? parseFloat(stockData.retailPriceUsd) : null,
          wholesalePrice1: stockData?.wholesalePrice1 ? parseFloat(stockData.wholesalePrice1) : null,
          currentCost: stockData?.currentCost ? parseFloat(stockData.currentCost) : null,
          lastPrice: lastPrice,
          lastSupplier: lastSupplier,
          sold30d: orderRec?.sold30d || 0,
          sold60d: orderRec?.sold60d || 0,
          sold90d: orderRec?.sold90d || 0,
          avgSalePrice: profitData?.retailPriceUsd || null,
          profitPerUnit: profitData?.profitPerUnit || null,
          kievyanStock: kievyan,
          sevanStock: sevan,
        });
      }

      console.log(`Product Search: Returning ${results.length} complete product records`);

      res.json({ results, totalCount: results.length });
    } catch (error) {
      console.error("CompStyle product search error:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  // ==================== CHIP: Armenian Tax Invoice Import ====================

  app.get("/api/chip/imported-products", async (req, res) => {
    try {
      // Aggregate stock by product name (Armenian)
      const purchaseData = await db.select({
        productName: chipPurchaseInvoiceItems.productName,
        unit: chipPurchaseInvoiceItems.unit,
        totalQty: sql<number>`CAST(SUM(${chipPurchaseInvoiceItems.quantity}) AS INTEGER)`,
        avgUnitPrice: sql<string>`AVG(${chipPurchaseInvoiceItems.unitPrice})`,
        totalValue: sql<string>`SUM(${chipPurchaseInvoiceItems.lineTotal})`,
        lastDate: sql<string>`MAX(${chipPurchaseInvoices.issueDate})`,
      })
      .from(chipPurchaseInvoiceItems)
      .innerJoin(chipPurchaseInvoices, eq(chipPurchaseInvoiceItems.invoiceId, chipPurchaseInvoices.id))
      .groupBy(chipPurchaseInvoiceItems.productName, chipPurchaseInvoiceItems.unit);

      const salesData = await db.select({
        productName: chipSalesInvoiceItems.productName,
        unit: chipSalesInvoiceItems.unit,
        totalQty: sql<number>`CAST(SUM(${chipSalesInvoiceItems.quantity}) AS INTEGER)`,
        avgUnitPrice: sql<string>`AVG(${chipSalesInvoiceItems.unitPrice})`,
        totalValue: sql<string>`SUM(${chipSalesInvoiceItems.lineTotal})`,
        lastDate: sql<string>`MAX(${chipSalesInvoices.issueDate})`,
      })
      .from(chipSalesInvoiceItems)
      .innerJoin(chipSalesInvoices, eq(chipSalesInvoiceItems.invoiceId, chipSalesInvoices.id))
      .groupBy(chipSalesInvoiceItems.productName, chipSalesInvoiceItems.unit);

      // Create a map for easy lookup
      const stockMap = new Map<string, any>();

      // Add purchase items
      purchaseData.forEach(item => {
        const key = item.productName || 'Unknown';
        if (!stockMap.has(key)) {
          stockMap.set(key, {
            productName: key,
            unit: item.unit || 'units',
            purchaseQty: 0,
            salesQty: 0,
            purchaseValue: 0,
            salesValue: 0,
            purchasePrice: 0,
            salesPrice: 0,
            lastUpdate: null,
          });
        }
        const entry = stockMap.get(key);
        entry.purchaseQty = item.totalQty || 0;
        entry.purchaseValue = parseFloat(item.totalValue || '0');
        entry.purchasePrice = parseFloat(item.avgUnitPrice || '0');
        entry.lastUpdate = item.lastDate;
      });

      // Add sales items
      salesData.forEach(item => {
        const key = item.productName || 'Unknown';
        if (!stockMap.has(key)) {
          stockMap.set(key, {
            productName: key,
            unit: item.unit || 'units',
            purchaseQty: 0,
            salesQty: 0,
            purchaseValue: 0,
            salesValue: 0,
            purchasePrice: 0,
            salesPrice: 0,
            lastUpdate: null,
          });
        }
        const entry = stockMap.get(key);
        entry.salesQty = item.totalQty || 0;
        entry.salesValue = parseFloat(item.totalValue || '0');
        entry.salesPrice = parseFloat(item.avgUnitPrice || '0');
        if (!entry.lastUpdate || new Date(item.lastDate || '') > new Date(entry.lastUpdate)) {
          entry.lastUpdate = item.lastDate;
        }
      });

      // Convert to array and add computed fields
      const stockList = Array.from(stockMap.values()).map(item => ({
        ...item,
        currentStock: item.purchaseQty - item.salesQty,
        netValue: item.purchaseValue - item.salesValue,
      }));

      res.json(stockList);
    } catch (error) {
      console.error("Error fetching imported products:", error);
      res.status(500).json({ error: "Failed to fetch imported products" });
    }
  });

  app.post("/api/chip/import-invoices", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length < 4) {
        return res.status(400).json({ error: "CSV file must have at least 4 rows" });
      }

      // Row 1 (index 0) = document type indicator
      const documentType = lines[0].toLowerCase();
      const isReceived = documentType.includes('ստացված');
      const isIssued = documentType.includes('դուրս');

      if (!isReceived && !isIssued) {
        return res.status(400).json({ error: "Cannot determine invoice type. Expected Armenian text for Received (ստացված) or Issued (Դուրս գրված) invoices." });
      }

      const invoices: Array<{ invoice: any; items: any[] }> = [];
      const errors: string[] = [];
      const invoiceMap = new Map<string, { invoice: any; items: any[] }>();

      // Data starts from row 4 (index 3)
      for (let i = 3; i < lines.length; i++) {
        try {
          const cols = lines[i].split(',').map(c => c.trim());
          
          // Check minimum columns
          if (cols.length < 35) {
            errors.push(`Row ${i + 1}: Not enough columns (${cols.length} < 35)`);
            continue;
          }

          let invoiceNumber = '';
          let issuerName = '';
          let issueDate = new Date();
          let totalAmount = 0;
          let productName = '';
          let quantity = 0;
          let unitPrice = 0;
          let subtotal = 0;
          let vatPercent = 20;
          let vatAmount = 0;
          let hsCode = '';
          let unit = '';

          if (isReceived) {
            // PURCHASE INVOICE (Ստացված)
            invoiceNumber = cols[1] || '';
            issuerName = cols[3] || 'Unknown';
            issueDate = parseDate(cols[5]);
            totalAmount = parseFloat(cols[8]) || 0;
            hsCode = cols[32] || '';
            productName = cols[33] || 'Product';
            unit = cols[35] || 'units';
            quantity = parseFloat(cols[37]) || 1;
            unitPrice = parseFloat(cols[38]) || 0;
            subtotal = parseFloat(cols[40]) || 0;
            vatPercent = parseFloat(cols[44]) || 20;
            vatAmount = parseFloat(cols[45]) || 0;
          } else {
            // SALES INVOICE (Դուրս գրված)
            invoiceNumber = cols[1] || '';
            issuerName = cols[4] || 'Unknown';
            issueDate = parseDate(cols[6]);
            totalAmount = parseFloat(cols[9]) || 0;
            hsCode = cols[34] || '';
            productName = cols[35] || 'Product';
            unit = cols[37] || 'units';
            quantity = parseFloat(cols[39]) || 1;
            unitPrice = parseFloat(cols[40]) || 0;
            subtotal = parseFloat(cols[42]) || 0;
            vatPercent = parseFloat(cols[46]) || 20;
            vatAmount = parseFloat(cols[47]) || 0;
          }

          if (!invoiceNumber) {
            errors.push(`Row ${i + 1}: Missing invoice number (col B was empty)`);
            continue;
          }

          if (subtotal <= 0) {
            errors.push(`Row ${i + 1}: Invalid subtotal (${subtotal}). Invoice: ${invoiceNumber}`);
            continue;
          }

          const invoiceKey = invoiceNumber;

          if (!invoiceMap.has(invoiceKey)) {
            const invoice = {
              invoiceSeries: invoiceNumber.replace(/[0-9]/g, '') || 'DEFAULT',
              invoiceNumber,
              supplierName: isReceived ? issuerName : 'CHIP Technologies',
              customerName: isIssued ? issuerName : 'Supplier',
              status: 'pending',
              issueDate,
              supplyDate: issueDate,
              subtotal: subtotal.toString(),
              vatAmount: vatAmount.toString(),
              total: (subtotal + vatAmount).toString()
            };
            invoiceMap.set(invoiceKey, { invoice, items: [] });
          }

          // Only add item if it has meaningful data
          if (productName && (quantity > 0 || unitPrice > 0)) {
            const item = {
              productName: productName,
              description: productName,
              quantity: Math.max(1, Math.round(quantity)),
              unit: unit || 'units',
              unitPrice: unitPrice.toString(),
              lineTotal: subtotal.toString(),
              vatAmount: vatAmount.toString(),
              hsCode: hsCode || undefined,
              sku: undefined
            };
            invoiceMap.get(invoiceKey)!.items.push(item);
          }
        } catch (lineError) {
          errors.push(`Row ${i + 1}: ${String(lineError)}`);
        }
      }

      invoiceMap.forEach(inv => invoices.push(inv));

      let result;
      if (invoices.length > 0) {
        if (isReceived) {
          result = await storage.importPurchaseInvoices(invoices);
        } else {
          result = await storage.importSalesInvoices(invoices);
        }
        result.errors.push(...errors);
      } else {
        result = { imported: 0, skipped: 0, errors: errors.length > 0 ? errors : ["No valid invoices found in file"] };
      }

      res.json({
        success: true,
        type: isReceived ? 'purchase' : 'sales',
        ...result
      });
    } catch (error) {
      console.error("Error importing invoices:", error);
      res.status(500).json({ error: "Failed to import invoices", details: String(error) });
    }
  });

  // Helper function to parse dates in various formats
  function parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    // Try ISO format first
    let parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // Try DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(p => parseInt(p, 10));
      if (day && month && year) {
        parsed = new Date(year, month - 1, day);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    
    return new Date();
  }

  // ==================== AI Agent Routes ====================

  // Get all conversations
  app.get("/api/ai/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAiConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Create new conversation
  app.post("/api/ai/conversations", async (req, res) => {
    try {
      const validatedData = insertAiConversationSchema.parse({
        title: req.body.title || "New Conversation",
        llmProvider: req.body.llmProvider || "gemini",
      });
      const conversation = await storage.createAiConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Get conversation with messages
  app.get("/api/ai/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getAiConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await storage.getAiMessages(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Update conversation
  app.put("/api/ai/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAiConversationSchema.partial().parse(req.body);
      const updated = await storage.updateAiConversation(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/ai/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAiConversation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // AI file uploads use memory storage — content is extracted in-request, not persisted
  const aiUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // Send message to AI
  app.post("/api/ai/conversations/:id/messages", aiUpload.array('files', 5), async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getAiConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const { content, provider } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      const validProvider = ["gemini", "openai", "claude"].includes(provider) ? provider : "gemini";
      const files = req.files as Express.Multer.File[] || [];

      // Process attached files
      let fileContents = "";
      const attachments: Array<{filename: string; originalName: string; filePath: string; fileType: string}> = [];
      
      for (const file of files) {
        attachments.push({
          filename: file.originalname,
          originalName: file.originalname,
          filePath: "",
          fileType: file.mimetype,
        });

        // Read file contents from buffer for CSV/text files
        if (file.mimetype === 'text/csv' || file.mimetype === 'text/plain') {
          const fileContent = file.buffer.toString('utf-8');
          fileContents += `\n\n=== File: ${file.originalname} ===\n${fileContent.substring(0, 10000)}`;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.mimetype === 'application/vnd.ms-excel') {
          const workbook = XLSX.read(file.buffer, { type: "buffer" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csvData = XLSX.utils.sheet_to_csv(firstSheet);
          fileContents += `\n\n=== File: ${file.originalname} ===\n${csvData.substring(0, 10000)}`;
        }
      }

      // Save user message
      const userMessage = await storage.createAiMessage({
        conversationId,
        role: "user",
        content,
        attachments,
      });

      // Get conversation history
      const history = await storage.getAiMessages(conversationId);
      const chatHistory = history.slice(0, -1).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      chatHistory.push({ role: "user", content });

      // Generate AI response
      const llmProvider = (validProvider || conversation.llmProvider || "gemini") as LLMProvider;
      const aiResponse = await generateAIResponse(chatHistory, llmProvider, fileContents || undefined);

      // Save AI response
      const assistantMessage = await storage.createAiMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
      });

      // Update conversation title if it's the first message
      if (history.length <= 1) {
        const title = content.substring(0, 50) + (content.length > 50 ? "..." : "");
        await storage.updateAiConversation(conversationId, { title });
      }

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message", details: String(error) });
    }
  });

  // Export conversation as text/CSV
  app.get("/api/ai/conversations/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const format = req.query.format as string || 'text';
      
      const conversation = await storage.getAiConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await storage.getAiMessages(id);
      
      if (format === 'csv') {
        let csv = 'Role,Content,Timestamp\n';
        for (const msg of messages) {
          const escapedContent = msg.content.replace(/"/g, '""').replace(/\n/g, ' ');
          csv += `"${msg.role}","${escapedContent}","${msg.createdAt}"\n`;
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="conversation-${id}.csv"`);
        res.send(csv);
      } else {
        let text = `Conversation: ${conversation.title}\n`;
        text += `Created: ${conversation.createdAt}\n`;
        text += `Provider: ${conversation.llmProvider}\n\n`;
        text += '='.repeat(50) + '\n\n';
        
        for (const msg of messages) {
          text += `[${msg.role.toUpperCase()}] ${new Date(msg.createdAt!).toLocaleString()}\n`;
          text += msg.content + '\n\n';
          text += '-'.repeat(30) + '\n\n';
        }
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="conversation-${id}.txt"`);
        res.send(text);
      }
    } catch (error) {
      console.error("Error exporting conversation:", error);
      res.status(500).json({ error: "Failed to export conversation" });
    }
  });

  // Get database context for AI
  app.get("/api/ai/context", async (req, res) => {
    try {
      const context = await storage.getAiDatabaseContext();
      res.json({ context });
    } catch (error) {
      console.error("Error fetching AI context:", error);
      res.status(500).json({ error: "Failed to fetch context" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
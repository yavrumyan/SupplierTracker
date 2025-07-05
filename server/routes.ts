import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupplierSchema, insertOfferSchema, insertOrderSchema, insertOrderItemSchema, insertInquirySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_config });

export async function registerRoutes(app: Express): Promise<Server> {
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
        filename: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
      });

      // Process Excel file and extract data
      const workbook = XLSX.readFile(file.path);
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
      const inquiry = await storage.createInquiry(inquiryData);
      
      // TODO: Implement actual WhatsApp and email sending
      // For now, just return the inquiry
      res.status(201).json(inquiry);
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

  // Cost calculation file upload
  app.post("/api/suppliers/:id/cost-calculation", upload.single('file'), async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const costFile = await storage.createCostCalculationFile({
        supplierId,
        filename: file.filename,
        filePath: file.path,
      });

      res.status(201).json(costFile);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload cost calculation file" });
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

  const httpServer = createServer(app);
  return httpServer;
}

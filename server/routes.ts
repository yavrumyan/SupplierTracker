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
        // Delete the uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ error: "Invalid file type. Only .py and .txt files are allowed." });
      }

      // Read and validate the logic content
      const logicContent = fs.readFileSync(file.path, 'utf8');
      
      // Store the conversion logic in the cost calculation files table for now
      const costFile = await storage.createCostCalculationFile({
        supplierId,
        filename: file.originalname,
        filePath: file.path,
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
        // Delete the uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ error: "Invalid file type. Only .xlsx, .xls, and .csv files are allowed." });
      }

      // Check if conversion logic exists for this supplier
      const conversionLogic = await storage.getCostCalculationFile(supplierId);
      if (!conversionLogic) {
        // Delete the uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ error: "No conversion logic found. Please upload conversion logic first." });
      }

      // Read the conversion logic
      const logicContent = fs.readFileSync(conversionLogic.filePath, 'utf8');

      // Process the file using Python script
      const { spawn } = require('child_process');
      const pythonScript = path.join(process.cwd(), 'server', 'file_processor.py');
      
      return new Promise((resolve, reject) => {
        const python = spawn('python3', ['-c', `
import sys
import os
sys.path.append('${path.join(process.cwd(), 'server')}')
from file_processor import process_price_list
import json

file_path = sys.argv[1]
logic_content = """${logicContent.replace(/"/g, '\\"')}"""

result = process_price_list(file_path, logic_content)
print(json.dumps(result))
`, file.path]);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        python.on('close', async (code) => {
          try {
            if (code !== 0) {
              console.error("Python script error:", errorOutput);
              // Delete the uploaded file
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
              return res.status(500).json({ error: "Error processing file with conversion logic" });
            }

            const result = JSON.parse(output);
            
            if (!result.success) {
              // Delete the uploaded file
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
              return res.status(400).json({ error: result.error });
            }

            // Save the processed file to storage
            const processedFilename = result.output_filename || 'converted_price_list.csv';
            const processedFilePath = path.join(path.dirname(file.path), processedFilename);
            fs.writeFileSync(processedFilePath, result.csv_content);

            // Store the price list file in database
            const priceListFile = await storage.createPriceListFile({
              supplierId,
              filename: processedFilename,
              filePath: processedFilePath,
            });

            // Delete the original uploaded file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }

            res.status(201).json({
              success: true,
              message: "Price list processed successfully",
              file: priceListFile,
              preview_html: result.preview_html,
              row_count: result.row_count,
              column_count: result.column_count,
              columns: result.columns
            });

          } catch (error) {
            console.error("Error processing result:", error);
            // Delete the uploaded file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
            res.status(500).json({ error: "Failed to process file" });
          }
        });
      });

    } catch (error) {
      console.error("Error uploading price file:", error);
      // Delete the uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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

      if (!fs.existsSync(file.filePath)) {
        return res.status(404).json({ error: "File no longer exists on disk" });
      }

      res.download(file.filePath, file.filename);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
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
  insertCompstyleTotalProcurementSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import { spawn } from "child_process";
import archiver from "archiver";
import { db } from "./db";
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
  compstyleTotalProcurement
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

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
              const searchEntry = {
                supplierId: supplierId,
                sourceType: 'offer',
                sourceId: offer.id,
                supplier: supplier.name,
                category: null,
                brand: null,
                model: null,
                productName: line, // Use the line as product name
                price: null,
                currency: null,
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

  // Enhanced search endpoint for products across all sources
  app.get("/api/search", async (req, res) => {
    try {
      const { 
        keyword1 = '',
        keyword2 = '',
        keyword3 = '',
        source = '',
        supplier = '', 
        category = '', 
        brand = '', 
        page = '1',
        limit = '50'
      } = req.query;

      const filters = {
        supplier: supplier as string,
        category: category as string,
        brand: brand as string,
        sourceType: source as string
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
      const limitNum = parseInt(limit as string) || 50;
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedResults = searchResults.slice(startIndex, endIndex);

      res.json({
        results: paginatedResults,
        groupedResults,
        totalCount: searchResults.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(searchResults.length / limitNum)
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
      
      // Check if the file exists
      if (!fs.existsSync(priceListFile.filePath)) {
        return res.status(404).json({ error: "Price list file not found on disk" });
      }
      
      // Get supplier information
      const supplier = await storage.getSupplier(supplierId);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      
      // Read the CSV file content
      const csvContent = fs.readFileSync(priceListFile.filePath, 'utf8');
      
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
              console.error("Python script output:", output);
              console.error("Python script exit code:", code);
              // Delete the uploaded file
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
              return res.status(500).json({ error: `Error processing file with conversion logic: ${errorOutput}` });
            }

            const result = JSON.parse(output);
            
            if (!result.success) {
              // Delete the uploaded file
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
              return res.status(400).json({ error: result.error });
            }

            // Save the processed file to storage with UTF-8 encoding and BOM
            const processedFilename = result.output_filename || 'converted_price_list.csv';
            const processedFilePath = path.join(path.dirname(file.path), processedFilename);
            
            // Create buffer with UTF-8 BOM
            const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
            const contentBuffer = Buffer.from(result.csv_content, 'utf8');
            const finalBuffer = Buffer.concat([utf8BOM, contentBuffer]);
            
            fs.writeFileSync(processedFilePath, finalBuffer);

            // Store the price list file in database
            const priceListFile = await storage.createPriceListFile({
              supplierId,
              filename: processedFilename,
              originalName: file.originalname,
              filePath: processedFilePath,
              fileSize: file.size,
            });

            // Parse CSV content and populate search index
            try {
              const supplier = await storage.getSupplier(supplierId);
              if (supplier) {
                // Clear existing search index entries for this price list
                await storage.deleteSearchIndexBySource('price_list', priceListFile.id);
                
                // Parse CSV content properly
                const csvLines = result.csv_content.trim().split('\n');
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

                  searchIndexEntries.push(entry);
                }

                // Insert search index entries
                if (searchIndexEntries.length > 0) {
                  await storage.createSearchIndexEntries(searchIndexEntries);
                }
              }
            } catch (searchIndexError) {
              console.error("Error populating search index:", searchIndexError);
              // Don't fail the upload if search index population fails
            }

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

      // Set proper headers for UTF-8 encoding
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      
      // Read file as binary and ensure proper UTF-8 encoding
      const fileBuffer = fs.readFileSync(file.filePath);
      const fileContent = fileBuffer.toString('utf8');
      
      // Add UTF-8 BOM for better compatibility
      const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
      const contentBuffer = Buffer.from(fileContent, 'utf8');
      const finalBuffer = Buffer.concat([utf8BOM, contentBuffer]);
      
      res.send(finalBuffer);
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
        // Delete the uploaded file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ error: "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, and CSV files are allowed." });
      }

      // Store the document in database
      const document = await storage.createDocument({
        supplierId,
        filename: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: file.mimetype,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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

      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ error: "Document file no longer exists on disk" });
      }

      // Set proper headers for download
      res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
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

      // Delete the physical file
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      // Delete from database
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

      // Delete the physical file
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

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
            const searchEntry = {
              supplierId: offer.supplierId,
              sourceType: 'offer',
              sourceId: offer.id,
              supplier: supplier.name,
              category: null,
              brand: null,
              model: null,
              productName: line,
              price: null,
              currency: null,
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
      const exportDir = path.join(process.cwd(), 'temp-export');
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
      const csvContent = fs.readFileSync(file.path, 'utf8');
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

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      res.json({
        headers,
        rows: rows.slice(0, 10), // Only return first 10 rows for preview
        errors,
        validRows,
        totalRows: rows.length
      });

    } catch (error) {
      console.error("Preview error:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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
      const csvContent = fs.readFileSync(file.path, 'utf8');
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

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      // Add debugging info
      console.log('Import result:', result);
      if (result.errors.length > 0) {
        console.log('Import errors:', result.errors);
      }

      res.json(result);

    } catch (error) {
      console.error("Import error:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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

  app.get('/api/compstyle/transit', async (req, res) => {
    try {
      const data = await storage.getCompstyleTransit();
      res.json(data);
    } catch (error) {
      console.error('Error fetching transit data:', error);
      res.status(500).json({ error: 'Failed to fetch transit data' });
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
      
      // Stream products in chunks to avoid memory issues
      const chunkSize = 100;
      let offset = 0;
      let hasMore = true;
      
      while (hasMore) {
        const products = await db.select()
          .from(compstyleProductList)
          .orderBy(compstyleProductList.productName)
          .limit(chunkSize)
          .offset(offset);
        
        if (products.length === 0) {
          hasMore = false;
          break;
        }
        
        // Convert products to CSV format and write immediately
        for (const product of products) {
          const row = [
            product.id,
            product.sku || '',
            `"${product.productName.replace(/"/g, '""')}"`, // Escape quotes in product name
            product.stock,
            product.transit,
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
          res.write(row.join(',') + '\n');
        }
        
        offset += chunkSize;
        
        // If we got fewer products than the chunk size, we're done
        if (products.length < chunkSize) {
          hasMore = false;
        }
      }
      
      res.end();
    } catch (error) {
      console.error('Error exporting CSV:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to export CSV' });
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
      console.log("Processing file:", file.path);
      console.log("XLSX object:", Object.keys(XLSX));
      
      const workbook = XLSX.readFile(file.path);
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

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        res.json({
          success: true,
          message: `File processed successfully`,
          recordsProcessed: processedCount,
          fileType,
          originalName: file.originalname
        });

      } catch (processingError) {
        // Clean up uploaded file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
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
    if (value === null || value === undefined || value === "") return null;
    
    // If it's already a Date object
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    
    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      // Excel stores dates as days since 1900-01-01 (with some quirks)
      const excelEpoch = new Date(1900, 0, 1);
      const days = value - 2; // Adjust for Excel's leap year bug
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Try to parse as string
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
    console.log('Processing Transit file - clearing existing data...');
    
    // Clear existing transit data before processing new file
    await db.delete(compstyleTransit);
    
    let count = 0;
    const processedProducts = new Map<string, any>(); // Track products to avoid duplicates within same file
    
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
      
      // Debug logging for specific products
      const isTargetProduct = productName.includes('Процессор Intel Core i5 12400') || 
                              productName.includes('Принтер струйный МФУ Canon PIXMA MG2541S');
      
      if (isTargetProduct) {
        console.log(`\n=== ROW ${i} DEBUG ===`);
        console.log(`Product: "${productName}"`);
        console.log(`Quantity: ${qty}`);
        console.log(`Raw row data: [${row.slice(0, 5).join(', ')}...]`);
        console.log(`Product name length: ${productName.length}`);
        console.log(`Product name hex: ${Buffer.from(productName).toString('hex')}`);
      }
      
      // Parse optional numeric fields
      const purchasePriceUsd = parseNumericValue(row[2]);
      const purchasePriceAmd = parseNumericValue(row[3]);
      const currentCost = parseNumericValue(row[6]);
      
      const transitRecord = {
        productName, // Column A (Товар): Name of product
        qty, // Column B (Кол.): Quantity purchased
        purchasePriceUsd: purchasePriceUsd ? String(purchasePriceUsd) : null, // Column C (Цена $): Purchasing price in USD
        purchasePriceAmd: purchasePriceAmd ? String(purchasePriceAmd) : null, // Column D (Цена AMD): Purchasing price in AMD
        currentCost: currentCost ? String(currentCost) : null, // Column G (Уч. цена): Current actual cost
        purchaseOrderNumber: row[9] ? String(row[9]) : null, // Column J (Связь): Purchase Order Number
        destinationLocation: row[14] ? String(row[14]) : null, // Column O (Склад): Destination warehouse/store
        supplier: row[15] ? String(row[15]) : null, // Column P (Поставщик): Supplier name
      };
      
      // Check if we already processed this product in this file
      if (processedProducts.has(productName)) {
        // Sum quantities for duplicate products
        const existing = processedProducts.get(productName);
        const oldQty = existing.qty;
        existing.qty += qty; // Add quantity to existing total
        
        if (isTargetProduct) {
          console.log(`*** DUPLICATE FOUND ***`);
          console.log(`Previous quantity: ${oldQty}`);
          console.log(`Adding quantity: ${qty}`);
          console.log(`New total quantity: ${existing.qty}`);
        }
        
        // Keep other data from first occurrence, but update some fields if new ones have values
        if (transitRecord.purchasePriceUsd && !existing.purchasePriceUsd) {
          existing.purchasePriceUsd = transitRecord.purchasePriceUsd;
        }
        if (transitRecord.purchasePriceAmd && !existing.purchasePriceAmd) {
          existing.purchasePriceAmd = transitRecord.purchasePriceAmd;
        }
        if (transitRecord.currentCost && !existing.currentCost) {
          existing.currentCost = transitRecord.currentCost;
        }
        if (transitRecord.supplier && !existing.supplier) {
          existing.supplier = transitRecord.supplier;
        }
        
        console.log(`Found duplicate ${productName.substring(0, 50)}...: adding ${qty} to existing ${oldQty}, total now: ${existing.qty}`);
      } else {
        if (isTargetProduct) {
          console.log(`*** FIRST OCCURRENCE ***`);
          console.log(`Storing product with quantity: ${qty}`);
        }
        processedProducts.set(productName, { ...transitRecord, rowIndex: i });
      }
      
      if (isTargetProduct) {
        console.log(`=== END ROW ${i} DEBUG ===\n`);
      }
    }
    
    // Insert aggregated record for each unique product (with summed quantities)
    for (const [productName, record] of processedProducts) {
      const { rowIndex, ...recordData } = record;
      
      // Debug logging for specific products before database insertion
      const isTargetProduct = productName.includes('Процессор Intel Core i5 12400') || 
                              productName.includes('Принтер струйный МФУ Canon PIXMA MG2541S');
      
      if (isTargetProduct) {
        console.log(`\n*** FINAL DATABASE INSERT ***`);
        console.log(`Product: "${productName}"`);
        console.log(`Final quantity: ${record.qty}`);
        console.log(`Supplier: ${record.supplier}`);
        console.log(`Price USD: ${record.purchasePriceUsd}`);
      }
      
      await storage.createCompstyleTransit(recordData);
      count++;
      
      if (productName.includes('Адаптер Bluetooth Orico BTA-508-BK-BP')) {
        console.log(`Processed ${productName}: qty=${record.qty}, supplier=${record.supplier}`);
      }
    }
    
    console.log(`Transit file processed: ${count} unique products saved`);
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
          
          const orderInDb = await storage.createCompstyleSalesOrder(orderData);
          for (const item of orderLineItems) {
            await storage.createCompstyleSalesItem({
              ...item,
              salesOrderId: orderInDb.id
            });
          }
          count++;
          console.log(`✓ Saved sales order ${salesOrderNumber} with ${orderLineItems.length} items`);
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
          
          const orderInDb = await storage.createCompstylePurchaseOrder(orderData);
          for (const item of orderLineItems) {
            await storage.createCompstylePurchaseItem({
              ...item,
              purchaseOrderId: orderInDb.id
            });
          }
          count++;
          console.log(`✓ Saved purchase order ${purchaseOrderNumber} with ${orderLineItems.length} items`);
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
    let count = 0;
    
    // Extract period from filename
    const { periodStart, periodEnd } = extractPeriodFromFilename(filename);
    
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
      
      await storage.createCompstyleTotalSales({
        productName: String(row[1]), // Column B (КодТовара): Name of product
        qtySold,
        salePriceUsd: String(safeSalePrice),
        costPriceUsd: String(safeCostPrice),
        profitPerUnit: String(safeSalePrice - safeCostPrice), // Column F - Column G: Profit per unit
        totalProfit: String((safeSalePrice - safeCostPrice) * qtySold), // (Column F - Column G) * Column E: Total profit
        periodStart,
        periodEnd,
      });
      count++;
    }
    return count;
  }

  // Process Total procurement by goods files according to specifications
  async function processTotalProcurementFile(data: any[], filename: string): Promise<number> {
    let count = 0;
    
    // Extract period from filename
    const { periodStart, periodEnd } = extractPeriodFromFilename(filename);
    
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
      
      await storage.createCompstyleTotalProcurement({
        productName: String(row[1]), // Column B (КодТовара): Name of product
        qtyPurchased,
        purchasePriceUsd: purchasePriceUsd ? String(purchasePriceUsd) : null,
        periodStart,
        periodEnd,
      });
      count++;
    }
    return count;
  }

  const httpServer = createServer(app);
  return httpServer;
}

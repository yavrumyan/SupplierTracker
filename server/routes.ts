import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupplierSchema, insertOfferSchema, insertOrderSchema, insertOrderItemSchema, insertInquirySchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { spawn } from "child_process";
import archiver from "archiver";

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
        'ID', 'Name', 'Country', 'City', 'Contact Person', 'Phone', 'Email', 'WhatsApp',
        'Website', 'Categories', 'Brands', 'Working Style', 'Reputation', 'Notes',
        'Created At', 'Updated At'
      ].join(',') + '\n';
      
      const csvRows = suppliers.map(supplier => [
        supplier.id,
        `"${(supplier.name || '').replace(/"/g, '""')}"`,
        `"${(supplier.country || '').replace(/"/g, '""')}"`,
        `"${(supplier.city || '').replace(/"/g, '""')}"`,
        `"${(supplier.contactPerson || '').replace(/"/g, '""')}"`,
        `"${(supplier.phone || '').replace(/"/g, '""')}"`,
        `"${(supplier.email || '').replace(/"/g, '""')}"`,
        `"${(supplier.whatsapp || '').replace(/"/g, '""')}"`,
        `"${(supplier.website || '').replace(/"/g, '""')}"`,
        `"${(supplier.categories || []).join('; ').replace(/"/g, '""')}"`,
        `"${(supplier.brands || []).join('; ').replace(/"/g, '""')}"`,
        `"${(supplier.workingStyle || []).join('; ').replace(/"/g, '""')}"`,
        supplier.reputation || 0,
        `"${(supplier.notes || '').replace(/"/g, '""')}"`,
        supplier.createdAt ? new Date(supplier.createdAt).toISOString() : '',
        supplier.updatedAt ? new Date(supplier.updatedAt).toISOString() : ''
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

  const httpServer = createServer(app);
  return httpServer;
}

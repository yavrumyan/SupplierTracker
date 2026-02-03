import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  suppliers,
  searchIndex,
  compstyleProductList,
  compstyleTotalStock,
  compstyleTransit,
  compstyleSalesOrders,
  compstylePurchaseOrders,
  chipPurchaseInvoices,
  chipSalesInvoices,
} from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export type LLMProvider = "gemini" | "openai" | "claude";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateAIResponse(
  messages: ChatMessage[],
  provider: LLMProvider = "gemini",
  fileContents?: string
): Promise<string> {
  const dbContext = await storage.getAiDatabaseContext();
  
  const systemPrompt = `You are an AI assistant for SupHub, a comprehensive supplier management and business intelligence system. You have access to the following databases and can help analyze data, search for products, compare prices, and generate reports.

${dbContext}

CAPABILITIES:
1. Search products across suppliers using the search index
2. Find suppliers by country, category, brand, or reputation
3. Analyze CompStyle inventory, sales, and purchase data
4. Review CHIP tax invoices (Armenian 20% VAT)
5. Compare prices across different suppliers
6. Generate business insights and recommendations

When asked about specific data, I will query the database and provide accurate information.
Always respond in the same language as the user's question.
Format tables and data clearly when presenting results.
If you need more specific information to answer a question, ask for clarification.

${fileContents ? `\nATTACHED FILE CONTENTS:\n${fileContents}\n` : ""}`;

  if (provider === "gemini") {
    return await generateGeminiResponse(systemPrompt, messages);
  }
  
  throw new Error(`Provider ${provider} not yet implemented`);
}

async function generateGeminiResponse(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const contents = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "I understand. I'm ready to help you with SupHub data analysis, product searches, and business insights. How can I assist you?" }] },
      ...contents.slice(0, -1),
    ],
  });

  const lastMessage = messages[messages.length - 1];
  
  const userQuery = lastMessage.content.toLowerCase();
  let dataContext = "";
  
  if (userQuery.includes("supplier") || userQuery.includes("поставщик")) {
    const supplierData = await getSupplierSummary();
    dataContext += `\n\nSUPPLIER DATA:\n${supplierData}`;
  }
  
  if (userQuery.includes("product") || userQuery.includes("товар") || userQuery.includes("search") || userQuery.includes("найти")) {
    const keywords = extractSearchKeywords(userQuery);
    if (keywords.length > 0) {
      const productData = await searchProducts(keywords.join(" "));
      dataContext += `\n\nPRODUCT SEARCH RESULTS:\n${productData}`;
    }
  }
  
  if (userQuery.includes("stock") || userQuery.includes("inventory") || userQuery.includes("склад") || userQuery.includes("остаток")) {
    const stockData = await getStockSummary();
    dataContext += `\n\nSTOCK DATA:\n${stockData}`;
  }
  
  if (userQuery.includes("sales") || userQuery.includes("продаж")) {
    const salesData = await getSalesSummary();
    dataContext += `\n\nSALES DATA:\n${salesData}`;
  }
  
  if (userQuery.includes("invoice") || userQuery.includes("счет") || userQuery.includes("накладн")) {
    const invoiceData = await getInvoiceSummary();
    dataContext += `\n\nINVOICE DATA:\n${invoiceData}`;
  }
  
  if (userQuery.includes("transit") || userQuery.includes("shipping") || userQuery.includes("в пути")) {
    const transitData = await getTransitSummary();
    dataContext += `\n\nIN TRANSIT DATA:\n${transitData}`;
  }

  const enrichedQuery = dataContext 
    ? `${lastMessage.content}\n\n[DATABASE CONTEXT]${dataContext}`
    : lastMessage.content;

  // Simple retry logic with delay
  let retries = 3;
  let delay = 2000;
  
  while (retries > 0) {
    try {
      const result = await chat.sendMessage(enrichedQuery);
      const response = result.response;
      return response.text();
    } catch (err: any) {
      if (err.status === 429 && retries > 1) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      if (err.status === 429) {
        throw new Error("Rate limit exceeded. The AI service is currently busy. Please wait a minute and try again.");
      }
      throw err;
    }
  }
  throw new Error("Failed to generate response after multiple attempts.");
}

function extractSearchKeywords(query: string): string[] {
  const stopWords = new Set(["the", "a", "an", "is", "are", "for", "with", "and", "or", "find", "search", "show", "get", "what", "where", "how", "can", "do", "have", "найти", "найди", "покажи", "есть", "где"]);
  const words = query.toLowerCase().split(/\s+/);
  return words.filter(word => word.length > 2 && !stopWords.has(word));
}

async function getSupplierSummary(): Promise<string> {
  const allSuppliers = await db.select({
    id: suppliers.id,
    name: suppliers.name,
    country: suppliers.country,
    reputation: suppliers.reputation,
  }).from(suppliers).limit(50);
  
  if (allSuppliers.length === 0) return "No suppliers found.";
  
  const byCountry = allSuppliers.reduce((acc, s) => {
    acc[s.country] = (acc[s.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return `Total: ${allSuppliers.length} suppliers\nBy Country: ${JSON.stringify(byCountry)}\nTop suppliers: ${allSuppliers.slice(0, 10).map(s => `${s.name} (${s.country}, Rep: ${s.reputation || 'N/A'})`).join(", ")}`;
}

async function searchProducts(query: string): Promise<string> {
  const results = await db.select({
    productName: searchIndex.productName,
    supplier: searchIndex.supplier,
    brand: searchIndex.brand,
    category: searchIndex.category,
    price: searchIndex.price,
    currency: searchIndex.currency,
    stock: searchIndex.stock,
  }).from(searchIndex)
    .where(sql`${searchIndex.productName} ILIKE ${'%' + query + '%'} OR ${searchIndex.brand} ILIKE ${'%' + query + '%'}`)
    .limit(20);
  
  if (results.length === 0) return `No products found matching "${query}".`;
  
  return results.map(p => 
    `- ${p.productName} | ${p.supplier} | ${p.brand || 'N/A'} | ${p.price || 'N/A'} ${p.currency || ''} | Stock: ${p.stock || 'N/A'}`
  ).join("\n");
}

async function getStockSummary(): Promise<string> {
  const products = await db.select({
    productName: compstyleProductList.productName,
    stock: compstyleProductList.stock,
    transit: compstyleProductList.transit,
    retailPriceUsd: compstyleProductList.retailPriceUsd,
    cost: compstyleProductList.cost,
  }).from(compstyleProductList)
    .where(sql`${compstyleProductList.stock} > 0 OR ${compstyleProductList.transit} > 0`)
    .limit(30);
  
  if (products.length === 0) return "No stock data available.";
  
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalTransit = products.reduce((sum, p) => sum + (p.transit || 0), 0);
  
  return `Total items in stock: ${totalStock}\nTotal items in transit: ${totalTransit}\n\nTop products:\n${products.slice(0, 15).map(p => 
    `- ${p.productName}: Stock ${p.stock || 0}, Transit ${p.transit || 0}, Price $${p.retailPriceUsd || 'N/A'}`
  ).join("\n")}`;
}

async function getSalesSummary(): Promise<string> {
  const orders = await db.select({
    salesOrderNumber: compstyleSalesOrders.salesOrderNumber,
    orderDate: compstyleSalesOrders.orderDate,
    customer: compstyleSalesOrders.customer,
    location: compstyleSalesOrders.location,
    totalAmountUsd: compstyleSalesOrders.totalAmountUsd,
  }).from(compstyleSalesOrders)
    .orderBy(sql`${compstyleSalesOrders.orderDate} DESC`)
    .limit(20);
  
  if (orders.length === 0) return "No sales data available.";
  
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmountUsd || "0"), 0);
  
  return `Recent ${orders.length} sales orders, Total: $${totalRevenue.toFixed(2)}\n\n${orders.slice(0, 10).map(o => 
    `- ${o.salesOrderNumber} | ${o.customer || 'N/A'} | ${o.location} | $${o.totalAmountUsd || '0'}`
  ).join("\n")}`;
}

async function getInvoiceSummary(): Promise<string> {
  const purchases = await db.select({
    invoiceNumber: chipPurchaseInvoices.invoiceNumber,
    supplierName: chipPurchaseInvoices.supplierName,
    total: chipPurchaseInvoices.total,
    issueDate: chipPurchaseInvoices.issueDate,
  }).from(chipPurchaseInvoices).limit(10);
  
  const sales = await db.select({
    invoiceNumber: chipSalesInvoices.invoiceNumber,
    customerName: chipSalesInvoices.customerName,
    total: chipSalesInvoices.total,
    issueDate: chipSalesInvoices.issueDate,
  }).from(chipSalesInvoices).limit(10);
  
  let result = `Purchase Invoices (${purchases.length}):\n`;
  result += purchases.map(i => `- ${i.invoiceNumber} | ${i.supplierName} | ${i.total} AMD`).join("\n");
  result += `\n\nSales Invoices (${sales.length}):\n`;
  result += sales.map(i => `- ${i.invoiceNumber} | ${i.customerName} | ${i.total} AMD`).join("\n");
  
  return result;
}

async function getTransitSummary(): Promise<string> {
  const items = await db.select({
    productName: compstyleTransit.productName,
    qty: compstyleTransit.qty,
    purchasePriceUsd: compstyleTransit.purchasePriceUsd,
    supplier: compstyleTransit.supplier,
    status: compstyleTransit.status,
  }).from(compstyleTransit).limit(20);
  
  if (items.length === 0) return "No items in transit.";
  
  const totalQty = items.reduce((sum, i) => sum + (i.qty || 0), 0);
  const totalValue = items.reduce((sum, i) => sum + ((i.qty || 0) * parseFloat(i.purchasePriceUsd || "0")), 0);
  
  return `Total items in transit: ${totalQty} (Value: $${totalValue.toFixed(2)})\n\n${items.map(i => 
    `- ${i.productName} | Qty: ${i.qty} | $${i.purchasePriceUsd || 'N/A'} | ${i.supplier || 'N/A'} | ${i.status || 'ordered'}`
  ).join("\n")}`;
}

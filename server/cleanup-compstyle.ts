
import { db } from "./db";
import {
  compstyleKievyanStock,
  compstyleSevanStock,
  compstyleTotalStock,
  compstyleTransit,
  compstyleSalesOrders,
  compstyleSalesItems,
  compstylePurchaseOrders,
  compstylePurchaseItems,
  compstyleTotalSales,
  compstyleTotalProcurement,
  compstyleProductList,
  compstyleLocations
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function cleanupCompstyleData() {
  console.log("Starting CompStyle data cleanup...");
  
  try {
    // Delete in order to respect any potential foreign key constraints
    // (though there aren't any defined between these tables)
    
    await db.delete(compstyleSalesItems);
    console.log("✓ Cleared compstyle_sales_items");
    
    await db.delete(compstylePurchaseItems);
    console.log("✓ Cleared compstyle_purchase_items");
    
    await db.delete(compstyleSalesOrders);
    console.log("✓ Cleared compstyle_sales_orders");
    
    await db.delete(compstylePurchaseOrders);
    console.log("✓ Cleared compstyle_purchase_orders");
    
    await db.delete(compstyleTotalSales);
    console.log("✓ Cleared compstyle_total_sales");
    
    await db.delete(compstyleTotalProcurement);
    console.log("✓ Cleared compstyle_total_procurement");
    
    await db.delete(compstyleProductList);
    console.log("✓ Cleared compstyle_product_list");
    
    await db.delete(compstyleKievyanStock);
    console.log("✓ Cleared compstyle_kievyan_stock");
    
    await db.delete(compstyleSevanStock);
    console.log("✓ Cleared compstyle_sevan_stock");
    
    await db.delete(compstyleTotalStock);
    console.log("✓ Cleared compstyle_total_stock");
    
    await db.delete(compstyleTransit);
    console.log("✓ Cleared compstyle_transit");
    
    await db.delete(compstyleLocations);
    console.log("✓ Cleared compstyle_locations");
    
    console.log("\n✅ All CompStyle data has been cleaned up successfully!");
    console.log("You can now upload fresh reports.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupCompstyleData();

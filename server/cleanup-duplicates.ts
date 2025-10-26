
import { db } from "./db";
import { compstyleSalesOrders, compstylePurchaseOrders, compstyleSalesItems, compstylePurchaseItems } from "@shared/schema";
import { eq } from "drizzle-orm";

async function cleanupDuplicates() {
  console.log('🔍 Starting duplicate cleanup...\n');

  try {
    // Clean up duplicate sales orders
    console.log('📊 Analyzing sales orders...');
    const salesOrders = await db.select().from(compstyleSalesOrders).orderBy(compstyleSalesOrders.id);
    const seenSales = new Map<string, number>();
    const duplicateSalesIds: number[] = [];
    
    for (const order of salesOrders) {
      if (!order.orderDate) continue;
      const key = `${order.salesOrderNumber}-${order.orderDate.toISOString()}`;
      
      if (seenSales.has(key)) {
        duplicateSalesIds.push(order.id);
        console.log(`  ❌ Duplicate: Sales Order ${order.salesOrderNumber} on ${order.orderDate.toISOString().split('T')[0]}`);
      } else {
        seenSales.set(key, order.id);
      }
    }
    
    console.log(`\n📈 Found ${duplicateSalesIds.length} duplicate sales orders`);
    
    // Delete duplicate sales orders and their items
    if (duplicateSalesIds.length > 0) {
      console.log('🗑️  Deleting duplicate sales orders and their items...');
      for (const orderId of duplicateSalesIds) {
        await db.delete(compstyleSalesItems).where(eq(compstyleSalesItems.salesOrderId, orderId));
        await db.delete(compstyleSalesOrders).where(eq(compstyleSalesOrders.id, orderId));
      }
      console.log(`✅ Deleted ${duplicateSalesIds.length} duplicate sales orders\n`);
    }
    
    // Clean up duplicate purchase orders
    console.log('📊 Analyzing purchase orders...');
    const purchaseOrders = await db.select().from(compstylePurchaseOrders).orderBy(compstylePurchaseOrders.id);
    const seenPurchase = new Map<string, number>();
    const duplicatePurchaseIds: number[] = [];
    
    for (const order of purchaseOrders) {
      if (!order.orderDate) continue;
      const key = `${order.purchaseOrderNumber}-${order.orderDate.toISOString()}`;
      
      if (seenPurchase.has(key)) {
        duplicatePurchaseIds.push(order.id);
        console.log(`  ❌ Duplicate: Purchase Order ${order.purchaseOrderNumber} on ${order.orderDate.toISOString().split('T')[0]}`);
      } else {
        seenPurchase.set(key, order.id);
      }
    }
    
    console.log(`\n📈 Found ${duplicatePurchaseIds.length} duplicate purchase orders`);
    
    // Delete duplicate purchase orders and their items
    if (duplicatePurchaseIds.length > 0) {
      console.log('🗑️  Deleting duplicate purchase orders and their items...');
      for (const orderId of duplicatePurchaseIds) {
        await db.delete(compstylePurchaseItems).where(eq(compstylePurchaseItems.purchaseOrderId, orderId));
        await db.delete(compstylePurchaseOrders).where(eq(compstylePurchaseOrders.id, orderId));
      }
      console.log(`✅ Deleted ${duplicatePurchaseIds.length} duplicate purchase orders\n`);
    }
    
    // Summary
    console.log('\n✨ Cleanup Summary:');
    console.log(`   Sales Orders: ${salesOrders.length} total, ${duplicateSalesIds.length} duplicates removed, ${salesOrders.length - duplicateSalesIds.length} remaining`);
    console.log(`   Purchase Orders: ${purchaseOrders.length} total, ${duplicatePurchaseIds.length} duplicates removed, ${purchaseOrders.length - duplicatePurchaseIds.length} remaining`);
    console.log(`   Total duplicates removed: ${duplicateSalesIds.length + duplicatePurchaseIds.length}`);
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('ℹ️  You can now safely run: npm run db:push');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicates();

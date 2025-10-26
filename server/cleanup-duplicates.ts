
import { db } from "./db";
import { compstyleSalesOrders, compstylePurchaseOrders } from "@shared/schema";
import { sql } from "drizzle-orm";

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
    
    // Delete duplicate sales orders
    if (duplicateSalesIds.length > 0) {
      console.log('🗑️  Deleting duplicate sales orders...');
      await db.delete(compstyleSalesOrders).where(sql`id IN (${sql.join(duplicateSalesIds.map(id => sql`${id}`), sql`, `)})`);
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
    
    // Delete duplicate purchase orders
    if (duplicatePurchaseIds.length > 0) {
      console.log('🗑️  Deleting duplicate purchase orders...');
      await db.delete(compstylePurchaseOrders).where(sql`id IN (${sql.join(duplicatePurchaseIds.map(id => sql`${id}`), sql`, `)})`);
      console.log(`✅ Deleted ${duplicatePurchaseIds.length} duplicate purchase orders\n`);
    }
    
    // Summary
    console.log('\n✨ Cleanup Summary:');
    console.log(`   Sales Orders: ${salesOrders.length} total, ${duplicateSalesIds.length} duplicates removed, ${salesOrders.length - duplicateSalesIds.length} remaining`);
    console.log(`   Purchase Orders: ${purchaseOrders.length} total, ${duplicatePurchaseIds.length} duplicates removed, ${purchaseOrders.length - duplicatePurchaseIds.length} remaining`);
    console.log(`   Total duplicates removed: ${duplicateSalesIds.length + duplicatePurchaseIds.length}`);
    
    console.log('\n✅ Cleanup completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicates();

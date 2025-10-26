
import { db } from "./db";
import { sql } from "drizzle-orm";

async function addUniqueConstraints() {
  console.log('🔧 Adding unique constraints to prevent duplicates...\n');

  try {
    // Add unique constraint to sales orders
    console.log('📊 Adding unique constraint to compstyle_sales_orders...');
    await db.execute(sql`
      ALTER TABLE compstyle_sales_orders 
      ADD CONSTRAINT compstyle_sales_orders_sales_order_number_order_date_unique 
      UNIQUE (sales_order_number, order_date)
    `);
    console.log('✅ Unique constraint added to sales orders\n');

    // Add unique constraint to purchase orders
    console.log('📊 Adding unique constraint to compstyle_purchase_orders...');
    await db.execute(sql`
      ALTER TABLE compstyle_purchase_orders 
      ADD CONSTRAINT compstyle_purchase_orders_purchase_order_number_order_date_unique 
      UNIQUE (purchase_order_number, order_date)
    `);
    console.log('✅ Unique constraint added to purchase orders\n');

    console.log('✅ All unique constraints added successfully!');
    console.log('   Future uploads will automatically reject duplicate orders.');
    
    process.exit(0);
  } catch (error: any) {
    if (error.code === '42P07' || error.message?.includes('already exists')) {
      console.log('ℹ️  Constraints already exist - no action needed');
      process.exit(0);
    } else {
      console.error('\n❌ Error adding constraints:', error);
      console.error('\nThis might mean there are existing duplicates in the database.');
      console.error('Please run the cleanup script first: npx tsx server/cleanup-duplicates.ts');
      process.exit(1);
    }
  }
}

addUniqueConstraints();

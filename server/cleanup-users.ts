
import { db } from "./db";
import { users } from "@shared/schema";

async function cleanupUsers() {
  console.log("Starting user cleanup...");
  
  try {
    await db.delete(users);
    console.log("✓ All users deleted successfully");
    
    console.log("\n✅ User cleanup complete. You can now create new users with passwords.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupUsers();

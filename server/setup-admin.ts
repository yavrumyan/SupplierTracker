
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Replace this with your Replit user ID (found in browser DevTools Network tab when logged in)
const ADMIN_USER_ID = "44637051"; // Replace with your actual user ID

async function setupAdmin() {
  try {
    console.log(`Setting up admin for user ID: ${ADMIN_USER_ID}`);
    
    const [updated] = await db.update(users)
      .set({ 
        isAdmin: true, 
        isApproved: true 
      })
      .where(eq(users.id, ADMIN_USER_ID))
      .returning();

    if (updated) {
      console.log("✅ Admin setup complete!");
      console.log("User details:", updated);
    } else {
      console.log("❌ User not found. Make sure you've logged in at least once.");
    }
  } catch (error) {
    console.error("Error setting up admin:", error);
  } finally {
    process.exit(0);
  }
}

setupAdmin();

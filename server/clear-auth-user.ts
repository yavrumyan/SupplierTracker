
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function clearUserAuth() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error("Usage: tsx server/clear-auth-user.ts <user-id>");
    console.error("Example: tsx server/clear-auth-user.ts 44637051");
    process.exit(1);
  }

  console.log(`Clearing authentication data for user: ${userId}`);

  try {
    // Delete the user record completely so it can be recreated on next login
    const result = await db.delete(users).where(eq(users.id, userId)).returning();
    
    if (result.length > 0) {
      console.log("✅ User record deleted successfully");
      console.log("The user will be recreated on next login attempt");
      console.log("Note: You'll need to re-approve this user as admin after they log in");
    } else {
      console.log("❌ User not found in database");
    }
  } catch (error) {
    console.error("Error clearing user:", error);
    process.exit(1);
  }

  process.exit(0);
}

clearUserAuth();

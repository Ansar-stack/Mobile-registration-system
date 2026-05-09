import "dotenv/config";
import db from "./src/db/index.js";
import { users } from "./src/db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

console.log("🔍 Testing Database Connection...\n");
console.log("DB_MODE:", process.env.DB_MODE);
console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");

async function testDatabase() {
  try {
    // Test 1: Check if users table exists
    console.log("\n📋 Test 1: Checking users table...");
    const allUsers = await db.select().from(users);
    console.log("✅ Users table exists");
    console.log(`   Found ${allUsers.length} users`);
    
    if (allUsers.length > 0) {
      console.log("\n👥 Existing users:");
      allUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
      });
    }

    // Test 2: Check if admin exists
    console.log("\n📋 Test 2: Checking for admin user...");
    const [admin] = await db.select().from(users).where(eq(users.email, "admin@gmail.com"));
    
    if (admin) {
      console.log("✅ Admin user exists");
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      
      // Test 3: Verify password
      console.log("\n📋 Test 3: Testing password...");
      const passwordMatch = await bcrypt.compare("admin123", admin.password);
      if (passwordMatch) {
        console.log("✅ Password 'admin123' is correct");
      } else {
        console.log("❌ Password 'admin123' does NOT match");
        console.log("   Stored hash:", admin.password.substring(0, 20) + "...");
      }
    } else {
      console.log("❌ Admin user does NOT exist");
      console.log("\n🔧 Creating admin user...");
      
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin"
      });
      
      console.log("✅ Admin user created successfully");
    }

    console.log("\n✅ All tests completed!");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nFull error:", error);
  }
  
  process.exit(0);
}

testDatabase();

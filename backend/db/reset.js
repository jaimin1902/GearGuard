import pool from "./connection.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    console.log("Dropping all tables...");
    
    // Drop tables in reverse order of dependencies
    await client.query("DROP TABLE IF EXISTS maintenance_requests CASCADE");
    await client.query("DROP TABLE IF EXISTS equipment CASCADE");
    await client.query("DROP TABLE IF EXISTS work_centers CASCADE");
    await client.query("DROP TABLE IF EXISTS equipment_categories CASCADE");
    await client.query("DROP TABLE IF EXISTS team_members CASCADE");
    await client.query("DROP TABLE IF EXISTS maintenance_teams CASCADE");
    await client.query("DROP TABLE IF EXISTS users CASCADE");
    await client.query("DROP TABLE IF EXISTS departments CASCADE");
    
    // Drop function if exists
    await client.query("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE");
    
    console.log("✓ All tables dropped");
    
    // Run migrations to recreate schema
    console.log("\nRunning migrations...");
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith(".sql")) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        await client.query(sql);
        console.log(`✓ Completed: ${file}`);
      }
    }
    
    await client.query("COMMIT");
    console.log("\n✓ Database reset and migrations completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reset failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

resetDatabase()
  .then(() => {
    console.log("Reset completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Reset error:", error);
    process.exit(1);
  });


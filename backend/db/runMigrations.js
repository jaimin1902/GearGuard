import pool from "./connection.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Read and execute migration files
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
    console.log("All migrations completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

runMigrations()
  .then(() => {
    console.log("Migrations finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration error:", error);
    process.exit(1);
  });


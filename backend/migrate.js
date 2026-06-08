const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Gunakan connection string yang sama dengan server.js / database.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  console.log('🔄 Menjalankan migrasi database...');
  try {
    const sqlPath = path.join(__dirname, '../database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Eksekusi semua script SQL
    await pool.query(sql);
    console.log('✅ Migrasi database berhasil dijalankan!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err);
    process.exit(1);
  }
}

runMigration();

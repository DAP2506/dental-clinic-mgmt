/**
 * Supabase Data Backup Script
 * Backs up all tables and data from Supabase
 * Run with: node backup-supabase.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Tables to backup
const TABLES = [
  'patients',
  'doctors',
  'treatments',
  'cases',
  'case_treatments',
  'appointments',
  'invoices'
];

/**
 * Fetch all data from a table
 */
async function fetchTableData(tableName) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${tableName}:`, error.message);
    return null;
  }
}

/**
 * Create backup directory with timestamp
 */
function createBackupDirectory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const backupDir = path.join(__dirname, 'backups', `backup_${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return backupDir;
}

/**
 * Generate SQL INSERT statements from data
 */
function generateSQLInserts(tableName, data) {
  if (!data || data.length === 0) {
    return `-- No data in table: ${tableName}\n`;
  }

  let sql = `-- Data for table: ${tableName}\n`;
  sql += `-- Total records: ${data.length}\n\n`;

  data.forEach((row) => {
    const columns = Object.keys(row);
    const values = columns.map(col => {
      const value = row[col];
      
      if (value === null) {
        return 'NULL';
      } else if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      } else if (typeof value === 'object') {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      } else {
        return value;
      }
    });

    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  });

  sql += '\n';
  return sql;
}

/**
 * Main backup function
 */
async function backupDatabase() {
  console.log('🔄 Starting Supabase backup...\n');
  console.log(`📡 Connected to: ${SUPABASE_URL}\n`);

  const backupDir = createBackupDirectory();
  console.log(`📁 Backup directory: ${backupDir}\n`);

  const allData = {};
  let totalRecords = 0;

  // Fetch data from all tables
  for (const table of TABLES) {
    process.stdout.write(`📊 Fetching ${table}... `);
    const data = await fetchTableData(table);
    
    if (data !== null) {
      allData[table] = data;
      console.log(`✅ ${data.length} records`);
      totalRecords += data.length;
    } else {
      console.log(`⚠️  Failed`);
    }
  }

  console.log(`\n📈 Total records fetched: ${totalRecords}\n`);

  // Save JSON backup
  console.log('💾 Saving JSON backup...');
  const jsonFile = path.join(backupDir, 'backup_data.json');
  fs.writeFileSync(jsonFile, JSON.stringify(allData, null, 2));
  console.log(`✅ JSON backup saved: ${jsonFile}\n`);

  // Save SQL backup
  console.log('💾 Generating SQL backup...');
  let sqlContent = `-- Supabase Data Backup
-- Generated: ${new Date().toISOString()}
-- Database: ${SUPABASE_URL}
-- Total Records: ${totalRecords}

-- Note: Run the setup-database.sql script first to create tables
-- Then run this file to restore the data

SET client_encoding = 'UTF8';

`;

  TABLES.forEach(table => {
    if (allData[table]) {
      sqlContent += generateSQLInserts(table, allData[table]);
      sqlContent += '\n';
    }
  });

  const sqlFile = path.join(backupDir, 'backup_data.sql');
  fs.writeFileSync(sqlFile, sqlContent);
  console.log(`✅ SQL backup saved: ${sqlFile}\n`);

  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    database_url: SUPABASE_URL,
    total_records: totalRecords,
    tables: TABLES.map(table => ({
      name: table,
      records: allData[table]?.length || 0
    }))
  };

  const summaryFile = path.join(backupDir, 'backup_summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`✅ Backup summary saved: ${summaryFile}\n`);

  // Save individual table backups
  console.log('💾 Saving individual table backups...');
  const tablesDir = path.join(backupDir, 'tables');
  fs.mkdirSync(tablesDir, { recursive: true });

  TABLES.forEach(table => {
    if (allData[table]) {
      const tableFile = path.join(tablesDir, `${table}.json`);
      fs.writeFileSync(tableFile, JSON.stringify(allData[table], null, 2));
      console.log(`  ✅ ${table}.json (${allData[table].length} records)`);
    }
  });

  console.log('\n✨ Backup completed successfully!\n');
  console.log('📦 Backup contents:');
  console.log(`  - backup_data.json (all data in one file)`);
  console.log(`  - backup_data.sql (SQL restore script)`);
  console.log(`  - backup_summary.json (backup metadata)`);
  console.log(`  - tables/ (individual table JSON files)`);
  console.log(`\n📂 Location: ${backupDir}\n`);
}

// Run the backup
backupDatabase().catch(error => {
  console.error('❌ Backup failed:', error);
  process.exit(1);
});

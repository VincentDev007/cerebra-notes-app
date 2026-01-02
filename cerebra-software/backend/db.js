//  IMPORTS // 
// import sql.js (database) 
const initSqlJs = require('sql.js');

// handles file paths correctly across different operating systems
const path = require('path');

// allows us to work with files and folders and save database to disk
const fs = require('fs');


// PATHS //
// defines the path to the data folder
const dataDir = path.join(__dirname, '..', 'data');

// defines the complete path to the database file
const dbPath = path.join(dataDir, 'urbrain.db');


// DATA FOLDER CREATION //
// check if the data folder exists
if (!fs.existsSync(dataDir)) {
    // if the folder doesn't exist, create it
    fs.mkdirSync(dataDir);
    
    // log message
    console.log('📁 Created data folder at:', dataDir);
}


// INITIALIZE DATABASE //
// sql.js is asynchronous, so we need to use async/await
async function initializeDatabase() {
    try {
        // Load SQL.js module
        console.log('🔄 Loading SQL.js module...');
        const SQL = await initSqlJs();
        console.log('✅ SQL.js module loaded');
        
        // check if database file already exists
        let db;
        
        if (fs.existsSync(dbPath)) {
            // Database file exists - load it from disk
            console.log('📂 Loading existing database from:', dbPath);
            
            // Read the database file as a buffer (binary data)
            const buffer = fs.readFileSync(dbPath);
            
            // Create database instance from the file data
            db = new SQL.Database(buffer);
            
            console.log('✅ Existing database loaded successfully');
        } else {
            // Database file doesn't exist - create a new empty database
            console.log('📝 Creating new database...');
            
            // Create a new empty database in memory
            db = new SQL.Database();
            
            console.log('✅ New database created');
        }
        
        // CRITICAL FIX: Enable foreign keys BEFORE creating tables
        // This ensures foreign keys are always active
        db.exec('PRAGMA foreign_keys = ON');
        console.log('✅ Foreign keys enabled');

        // CREATE THE DATABASE TABLES //
        console.log('📋 Creating database tables...');
        
        // table - folders
        db.exec(`
            CREATE TABLE IF NOT EXISTS folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                modified_at TEXT NOT NULL
            )
        `);
        console.log('✅ Folders table created');
        
        // table - notes
        db.exec(`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT DEFAULT '',
                folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                modified_at TEXT NOT NULL
            )
        `);
        console.log('✅ Notes table created');
        
        // table - sticky notes
        db.exec(`
            CREATE TABLE IF NOT EXISTS sticky_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                modified_at TEXT NOT NULL
            )
        `);
        console.log('✅ Sticky notes table created');
        
        // table - settings
        db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL
            )
        `);
        console.log('✅ Settings table created');
        
        console.log('✅ All database tables created successfully!');
        
        
        // SAVES DATABASE TO DISK //
        // converts the in-memory database to a format that can be saved to disk
        const data = db.export();
        
        // convert to Buffer (Node.js format for binary data)
        const buffer = Buffer.from(data);
        
        // this saves the database to urbrain.db on your hard drive
        fs.writeFileSync(dbPath, buffer);
        
        console.log('💾 Database saved to disk');
        

        // AUTO SAVE ON ANY CHANGES //
        // create a function to save database whenever data changes
        db.saveToFile = function() {
            try {
                const data = db.export();
                const buffer = Buffer.from(data);
                fs.writeFileSync(dbPath, buffer);
            } catch (error) {
                console.error('❌ Failed to save database:', error.message);
            }
        };
        
        // IMPORTANT FIX: Store original methods before wrapping
        const originalRun = db.run.bind(db);
        const originalExec = db.exec.bind(db);
        
        // Wrap db.run to auto-save after changes
        db.run = function(sql, params) {
            // Always ensure foreign keys are on before any operation
            originalExec('PRAGMA foreign_keys = ON');
            
            // Execute the query
            const result = originalRun(sql, params);
            
            // Auto-save after the query
            db.saveToFile();
            
            return result;
        };
        
        // Also wrap db.exec for consistency
        db.exec = function(sql, params) {
            // Always ensure foreign keys are on before any operation
            originalExec('PRAGMA foreign_keys = ON');
            
            // Execute the query
            const result = originalExec(sql, params);
            
            // Don't auto-save on SELECT queries
            if (!sql.trim().toUpperCase().startsWith('SELECT') && 
                !sql.trim().toUpperCase().startsWith('PRAGMA')) {
                db.saveToFile();
            }
            
            return result;
        };
        
        // Helper method to get last insert ID properly
        db.getLastInsertId = function() {
            const result = originalExec('SELECT last_insert_rowid() as id');
            if (result && result.length > 0 && result[0].values.length > 0) {
                return result[0].values[0][0];
            }
            return null;
        };
        
        // return the database connection
        return db;
        
    } catch (error) {
        // if anything goes wrong during initialization
        console.error('❌ Database initialization failed!');
        console.error('Error details:', error.message);
        process.exit(1); // exit the app - can't continue without database
    }
}


// EXPORT THE DATABASE CONNECTION // 
module.exports = initializeDatabase();
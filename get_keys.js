const sqlite3 = require('./server/node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT key, value FROM settings WHERE key IN ('supabase_url', 'supabase_key')", (err, rows) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(JSON.stringify(rows));
        db.close();
    });
});

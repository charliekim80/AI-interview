const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../db/database.sqlite');

if (!fs.existsSync(DB_PATH)) {
    console.log('SQLite database not found at:', DB_PATH);
    process.exit(0);
}

const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

async function migrate() {
    console.log('--- Starting Timezone Migration (Local to UTC) ---');
    
    const tables = [
        { name: 'settings', dateCol: 'updated_at', pk: 'key' },
        { name: 'jobs', dateCol: 'created_at', pk: 'id' },
        { name: 'candidates', dateCol: 'created_at', pk: 'id' },
        { name: 'interviews', dateCol: 'created_at', pk: 'id' },
        { name: 'interviews', dateCol: 'completed_at', pk: 'id' }
    ];

    for (const table of tables) {
        console.log(`Processing table: ${table.name} (${table.dateCol})`);
        
        // 1. 타임존 표시(Z)가 없는 데이터 조회
        const rows = await all(`SELECT ${table.pk}, ${table.dateCol} FROM ${table.name} WHERE ${table.dateCol} IS NOT NULL AND ${table.dateCol} NOT LIKE '%Z'`);
        
        let count = 0;
        for (const row of rows) {
            const rawVal = row[table.dateCol];
            const pkVal = row[table.pk];
            if (!rawVal) continue;

            let newVal = rawVal;
            if (rawVal.includes(' ')) {
                newVal = rawVal.replace(' ', 'T') + 'Z';
            } else if (!rawVal.includes('Z')) {
                newVal = rawVal + 'Z';
            }

            if (newVal !== rawVal) {
                await run(`UPDATE ${table.name} SET ${table.dateCol} = ? WHERE ${table.pk} = ?`, [newVal, pkVal]);
                count++;
            }
        }
        console.log(`Updated ${count} rows in ${table.name}.`);
    }

    console.log('--- Migration Completed ---');
    db.close();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    db.close();
});

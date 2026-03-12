const cp = require('child_process');
const db = require('./server/db/database');
const fs = require('fs');

(async () => {
    try {
        let token = process.env.GITHUB_TOKEN;
        if (!token) {
            const row = await db.get("SELECT value FROM settings WHERE key='github_token'");
            token = row?.value || '';
        }
        
        if (!token) {
            console.log('NO_GITHUB_TOKEN');
            process.exit(1);
        }

        const repoUrl = `https://${token}@github.com/charliekim80/AI-interview.git`;
        
        // Remove existing .git safely if exists? No, just check
        if (!fs.existsSync('.git')) {
             cp.execSync('git init');
        }
        
        cp.execSync('git add .');
        try {
             cp.execSync('git commit -m "feat: AI Interview Cloud Deployment Phase (Phase 1-4)"');
        } catch(e) { /* might be nothing to commit */ }
        
        cp.execSync('git branch -M main');
        
        try {
            cp.execSync('git remote remove origin', { stdio: 'ignore' });
        } catch { }

        cp.execSync(`git remote add origin ${repoUrl}`);
        console.log('Pushing to GitHub...');
        cp.execSync('git push -u origin main --force');
        console.log('PUSH_SUCCESS');
        process.exit(0);

    } catch(e) {
        console.error('ERROR:', e.message);
        if(e.stdout) console.error(e.stdout.toString());
        if(e.stderr) console.error(e.stderr.toString());
        process.exit(1);
    }
})();

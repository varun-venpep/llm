const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /STUDENT/g, to: 'LEARNER' },
    { from: /Students/g, to: 'Learners' },
    { from: /Student/g, to: 'Learner' },
    { from: /students/g, to: 'learners' },
    { from: /student/g, to: 'learner' }
];

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        let filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            if (!filepath.includes('node_modules') && !filepath.includes('.next') && !filepath.includes('.git')) {
                walk(filepath, callback);
            }
        } else {
            callback(filepath);
        }
    });
}

const targetDirs = ['./src', './prisma', './migrate_role.ts', './check_db.ts', './check_teams.ts'];

targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        if (fs.statSync(dir).isDirectory()) {
            walk(dir, (file) => {
                let content = fs.readFileSync(file, 'utf8');
                let newContent = content;
                replacements.forEach(r => {
                    newContent = newContent.replace(r.from, r.to);
                });
                if (newContent !== content) {
                    fs.writeFileSync(file, newContent, 'utf8');
                    console.log(`Updated: ${file}`);
                }
            });
        } else {
            let content = fs.readFileSync(dir, 'utf8');
            let newContent = content;
            replacements.forEach(r => {
                newContent = newContent.replace(r.from, r.to);
            });
            if (newContent !== content) {
                fs.writeFileSync(dir, newContent, 'utf8');
                console.log(`Updated: ${dir}`);
            }
        }
    }
});

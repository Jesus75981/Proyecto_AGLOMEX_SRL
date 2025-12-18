const fs = require('fs');
const path = 'front-end/src/assets/pages/VentasPage.jsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let mode = 'NORMAL'; // NORMAL, SKIP_HEAD, KEEP_REMOTE

    for (let line of lines) {
        if (line.startsWith('<<<<<<< HEAD')) {
            mode = 'SKIP_HEAD';
        } else if (line.startsWith('=======')) {
            mode = 'KEEP_REMOTE';
        } else if (line.startsWith('>>>>>>> origin/main')) {
            mode = 'NORMAL';
        } else {
            if (mode === 'NORMAL' || mode === 'KEEP_REMOTE') {
                newLines.push(line);
            }
        }
    }

    fs.writeFileSync(path, newLines.join('\n'));
    console.log('Successfully resolved conflicts in ' + path);
} catch (err) {
    console.error('Error resolving conflicts:', err);
    process.exit(1);
}

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../front-end/src/assets/pages/InventarioPage.jsx');

try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Find the index of the export statement
    const exportStatement = 'export default InventarioPage;';
    const lastIndex = content.indexOf(exportStatement);

    if (lastIndex !== -1) {
        // Keep content up to the end of the export statement
        // Add a newline for good measure
        const cleanContent = content.substring(0, lastIndex + exportStatement.length) + '\n';

        fs.writeFileSync(filePath, cleanContent, 'utf8');
        console.log('Successfully cleaned InventarioPage.jsx');
    } else {
        console.error('Could not find export statement in file');
    }

} catch (err) {
    console.error('Error cleaning file:', err);
}

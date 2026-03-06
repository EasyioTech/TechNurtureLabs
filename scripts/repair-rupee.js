const fs = require('fs');
const path = require('path');

const files = [
    "src/modules/super-admin/components/tabs/overview-tab.tsx",
    "src/modules/super-admin/components/tabs/payment-plans-tab.tsx",
    "src/modules/super-admin/components/tabs/promo-codes-tab.tsx",
    "src/modules/super-admin/components/tabs/schools-tab.tsx",
    "src/modules/super-admin/components/engagement-charts.tsx",
    "src/modules/super-admin/components/promo-code-dialog.tsx",
];

const root = process.cwd();

files.forEach(relPath => {
    const fullPath = path.join(root, relPath);
    if (!fs.existsSync(fullPath)) return;

    // The files might have '?' (replacement character) if saved incorrectly,
    // or they might have the bad byte sequences.
    // Since I saw '?' in the terminal, they are likely already corrupted to \uFFFD.

    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // Replace \uFFFD (Replacement Character) with ₹
    // This is safe here because we know mostly these characters were Rupees.
    content = content.replace(/\uFFFD/g, '₹');

    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('REPAIRED:', relPath);
    } else {
        console.log('UNCHANGED:', relPath);
    }
});

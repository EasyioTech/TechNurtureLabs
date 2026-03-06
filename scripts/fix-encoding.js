const fs = require('fs');
const path = require('path');

const files = [
    "src/app/school-portal/register/page.tsx",
    "src/components/landing/PricingHybrid.tsx",
    "src/modules/super-admin/components/tabs/overview-tab.tsx",
    "src/modules/super-admin/components/tabs/payment-plans-tab.tsx",
    "src/modules/super-admin/components/tabs/promo-codes-tab.tsx",
    "src/modules/super-admin/components/tabs/schools-tab.tsx",
    "src/modules/super-admin/components/engagement-charts.tsx",
    "src/modules/super-admin/components/promo-code-dialog.tsx",
];

// When a UTF-8 file is read as Latin-1/Windows-1252 and re-saved,
// each multi-byte UTF-8 sequence gets garbled. We fix by replacing
// the garbled sequences (now stored as utf-8 strings of latin-1 codepoints)
// back to the original unicode characters.

const replacements = [
    // ₹ (U+20B9) — 3-byte UTF-8: E2 82 B9 → read as Latin-1 → â‚¹
    ['\u00e2\u0082\u00b9', '₹'],
    // — (U+2014 em dash) — E2 80 94 → â€"
    ['\u00e2\u0080\u0094', '\u2014'],
    // ' (U+2018 left single quote) — E2 80 98 → â€˜
    ['\u00e2\u0080\u0098', '\u2018'],
    // ' (U+2019 right single quote) — E2 80 99 → â€™
    ['\u00e2\u0080\u0099', '\u2019'],
    // · (U+00B7 middle dot) — C2 B7 → Â·
    ['\u00c2\u00b7', '\u00b7'],
    // … (U+2026 ellipsis) — E2 80 A6 → â€¦
    ['\u00e2\u0080\u00a6', '\u2026'],
    // − (U+2212 minus sign) — E2 88 92 → âˆ'
    ['\u00e2\u0088\u0092', '\u2212'],
    // 🎉 (U+1F389 party popper) — F0 9F 8E 89 → ðŸŽ‰
    ['\u00f0\u009f\u008e\u0089', '🎉'],
    //   (U+00A0 NBSP) — C2 A0 → Â 
    ['\u00c2\u00a0', ' '],
    // " (U+201C left double quote) — E2 80 9C → â€œ
    ['\u00e2\u0080\u009c', '\u201c'],
    // " (U+201D right double quote) — E2 80 9D → â€
    ['\u00e2\u0080\u009d', '\u201d'],
];

const root = process.cwd();

files.forEach(relPath => {
    const fullPath = path.join(root, relPath);
    if (!fs.existsSync(fullPath)) {
        console.log('SKIP (not found):', fullPath);
        return;
    }

    // Read as latin1 to get the raw byte values as codepoints
    let content = fs.readFileSync(fullPath, 'latin1');
    const original = content;

    replacements.forEach(([bad, good]) => {
        // Use a global replace
        while (content.includes(bad)) {
            content = content.split(bad).join(good);
        }
    });

    if (content !== original) {
        // Write back as latin1 (the string now has the correct unicode codepoints for UTF-8)
        // But we need to write the corrected content as proper UTF-8
        // Since our good characters are now proper unicode, write as utf-8
        fs.writeFileSync(fullPath, Buffer.from(content, 'latin1'));
        console.log('FIXED:', relPath);
    } else {
        console.log('CLEAN:', relPath);
    }
});

console.log('\nAll done!');

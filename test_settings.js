const { getPlatformSettings } = require('./src/components/landing/actions');
const { db } = require('./src/lib/db');

async function test() {
    try {
        const settings = await getPlatformSettings();
        console.log('Platform Settings:', settings);
        if (settings && settings.platform_name === 'TechNurture') {
            console.log('Verification Success: Settings fetched correctly.');
        } else {
            console.log('Verification Fail: Settings mismatch or fetch failed.');
        }
    } catch (err) {
        console.error('Verification Error:', err);
    }
}

test();

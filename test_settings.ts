import { getPlatformSettings } from './src/components/landing/actions';

async function test() {
    try {
        const settings = await getPlatformSettings();
        console.log('Platform Settings retrieved:', settings);
        if (settings) {
            console.log('✅ VERIFIED: getPlatformSettings returned data.');
        } else {
            console.log('❌ FAILED: getPlatformSettings returned null/undefined.');
        }
    } catch (err) {
        console.error('❌ FAILED: Error during fetch:', err);
    }
    process.exit(0);
}

test();

import { redis } from '../src/lib/redis';

async function test() {
    try {
        console.log("Fetching Redis Info...");
        const info = await redis.info();
        console.log("INFO LENGTH:", info.length);
        console.log("INFO PREVIEW:", info.substring(0, 500));

        console.log("DBSIZE:");
        console.log(await redis.dbsize());
        process.exit(0);
    } catch (err) {
        console.error("ERROR", err);
        process.exit(1);
    }
}
test();

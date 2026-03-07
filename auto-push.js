const { spawn } = require('child_process');

const push = spawn('npx', ['drizzle-kit', 'push'], {
    stdio: 'pipe',
    shell: true
});

push.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    if (output.includes('Do you want to truncate') || output.includes('You\'re about to')) {
        push.stdin.write('\n');
    }
});

push.stderr.on('data', (data) => {
    console.error(data.toString());
});

push.on('close', (code) => {
    console.log(`push exited with code ${code}`);
});

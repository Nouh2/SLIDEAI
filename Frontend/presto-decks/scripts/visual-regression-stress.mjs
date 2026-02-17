import { spawn } from 'node:child_process';

const runs = Number.parseInt(process.env.VR_STRESS_RUNS ?? '3', 10);
const readyTimeoutMs = process.env.VR_READY_TIMEOUT_MS ?? '120000';
const batchSize = process.env.VR_BATCH_SIZE ?? '20';

if (!Number.isFinite(runs) || runs < 1) {
  console.error(`Invalid VR_STRESS_RUNS value: ${process.env.VR_STRESS_RUNS}`);
  process.exit(1);
}

async function runVisualTest(index) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      VR_READY_TIMEOUT_MS: readyTimeoutMs,
      VR_BATCH_SIZE: batchSize,
    };

    console.log(`\n--- STRESS RUN ${index}/${runs} (VR_READY_TIMEOUT_MS=${readyTimeoutMs}, VR_BATCH_SIZE=${batchSize}) ---`);

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCommand, ['run', 'test:visual'], {
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Run ${index} failed with exit code ${code}`));
    });
  });
}

async function main() {
  for (let i = 1; i <= runs; i += 1) {
    await runVisualTest(i);
  }
  console.log(`\nStress test completed: ${runs}/${runs} runs passed.`);
}

main().catch((error) => {
  console.error(`\nStress test failed: ${error.message}`);
  process.exit(1);
});

'use strict';

const { execFileSync } = require('node:child_process');

for (const script of ['scripts/ci-smoke.js', 'scripts/ci-ai-smoke.js']) {
  execFileSync(process.execPath, [script], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
}

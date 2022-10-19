#! /usr/bin/env node

const terraform = require('../src/index.js');
const { spawn } = require('child_process');

(async () => {
  const args = process.argv.slice(2);

  const proc = spawn(terraform.executablePath, args, {
    stdio: [process.stdin, process.stdout, process.stderr]
  });

  proc.on('close', code => process.exit(code));
})();
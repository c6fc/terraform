#! /usr/bin/env node

const { Terraform } = require('../src/index.js');
const { spawn } = require('child_process');

const args = process.argv.slice(2)

const terraform = new Terraform();

const terraform = spawn(terraform, args, {
  stdio: [process.stdin, process.stdout, process.stderr]
});

terraform.on('close', code => process.exit(code))
'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const unzip = require('unzip-stream');
const axios = require('axios');
const crypto = require('crypto');
const stream = require('stream');
const { spawnSync } = require('child_process');
const findCacheDir = require('find-cache-dir');

// Find the package.json for the invoking module CWD
let referencePath = '.';
const depth = 0, maxDepth = 2;
while (!fs.existsSync(path.join(path.resolve(referencePath, 'package.json'))) && depth < maxDepth) {
	referencePath = path.join(referencePath, '..');
}

if (!fs.existsSync(path.join(path.resolve(referencePath, 'package.json')))) {
	throw new Error(`[!] Unable to locate package.json in current directory tree.`);
}

const myself = require(path.join(path.resolve(referencePath, 'package.json')));

const version = myself?.config?.tf_version || "1.2.5";
const cacheDir = findCacheDir({ name: '@c6fc/terraform', cwd: process.env.INIT_CWD });
const downloadPath = path.join(cacheDir, `terraform-download-part`);
const executablePath = path.join(cacheDir, `terraform-${version}`);

const archMap = {
	arm: "arm",
	arm64: "arm64",
	x32: "386",
	x64: "amd64"
};

const platMap = {
	linux: "linux"
};

const doInstall = async function() {	
	const arch = archMap?.[process.arch];
	const plat = platMap?.[process.platform];

	if (!!!arch) {
		console.log(`[!] Invalid architecture [${process.arch}]; must be one of [${Object.keys(archMap).join(", ")}]`);
		process.exit(-1);
	}

	if (!!!plat) {
		console.log(`[!] Invalid platform [${process.platform}]; must be one of [${Object.keys(platMap).join(", ")}]`);
		process.exit(-1);
	}

	console.log(`[*] Using Terraform ${version}`);

	if (!fs.existsSync(executablePath)) {

		console.log(`[*] Terraform binary isn't present. Downloading...`);

		fs.mkdirSync(cacheDir, { recursive: true });

		const downloadUrl = `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${plat}_${arch}.zip`;

		const pipeline = util.promisify(stream.pipeline);
		const download = await axios(downloadUrl, {
			responseType: 'stream'
		});

		const hashstream = calculateStreamHash();

		await pipeline(
			download.data,
			hashstream,
			unzip.Parse(),
			stream.Transform({
				objectMode: true,
				transform(entry, e, callback) {
					entry.pipe(fs.createWriteStream(downloadPath))
						.on('close', () => { callback(); });
				}
			})
		);

		const binaryHash = hashstream.hashValue;

		const hashes = await axios(`https://releases.hashicorp.com/terraform/${version}/terraform_${version}_SHA256SUMS`);

		const versionHash = hashes.data.split("\n").reduce((a, c) => {
			const [hash, version] = c.split('  ');
			return Object.assign(a, { [version]: hash });
		})[`terraform_${version}_${plat}_${arch}.zip`];

		if (versionHash !== binaryHash) {
			console.log(`[!] Failed to install Terraform ${version}. Binary hash of ${binaryHash} doesn't match expected hash ${versionHash}`);
			console.log(downloadPath);
			fs.unlinkSync(downloadPath);
			process.exit(1);
		}

		fs.renameSync(downloadPath, executablePath);
		fs.chmodSync(executablePath, '700');

		console.log(`[+] Hashes verified. Terraform ${version} installed successfully`);
	}

	return true;
};

const exec = async function(...args) {

	await isReady;

	let result = spawnSync(executablePath, args, {
		cwd: this.renderPath,
		stdio: [process.stdin, process.stdout, process.stderr]
	});

	if (result.status != 0) {
		console.log(`[!] Terraform '${args[0]}' failed with status code ${result.status}`);
		process.exit(result.status);
	}
}

function calculateStreamHash() {
  const hash = crypto.createHash('sha256');
  return new stream.Transform({
    transform(chunk, encoding, callback) {
      hash.update(chunk);
      this.push(chunk); // Pass the chunk down the pipeline
      callback();
    },
    flush(callback) {
      this.hashValue = hash.digest('hex');
      callback();
    },
  });
}

const isReady = doInstall();

module.exports = { cacheDir, version, exec, executablePath, isReady };
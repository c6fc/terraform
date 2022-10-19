'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const unzip = require('unzip-stream');
const axios = require('axios');
const crypto = require('crypto');
const stream = require('stream');
const findCacheDir = require('find-cache-dir');

const myself = require('../package.json');

const version = myself?.config?.tf_version || "1.2.5";
const cacheDir = findCacheDir({ name: myself.name, cwd: process.env.INIT_CWD });
const executablePath = path.join(cacheDir, `terraform-${version}`);

module.exports = { cacheDir, version, executablePath };

const archMap = {
	arm: "arm",
	arm64: "arm64",
	x32: "386",
	x64: "amd64"
};

const platMap = {
	linux: "linux"
};

(async () => {	
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

	if (!fs.existsSync(executablePath)) {

		fs.mkdirSync(cacheDir, { recursive: true });

		const downloadUrl = `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_linux_${arch}.zip`;

		const pipeline = util.promisify(stream.pipeline);
		const download = await axios(downloadUrl, {
			responseType: 'stream'
		});

		await pipeline(
			download.data,
			unzip.Parse(),
			stream.Transform({
				objectMode: true,
				transform(entry, e, callback) {
					entry.pipe(fs.createWriteStream(executablePath))
						.on('finish', callback);
				}
			})
		);

		fs.chmodSync(executablePath, '700');
	}
})();
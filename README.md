# @c6fc/terraform

Link and use the Terraform binary with NPM.

## Usage

```sh
npm install -p @c6fc/terraform@0.15.4 # Installs Terraform 0.15.4
```

```javascript
const terraform = require('@c6fc/terraform'); // Install and link Terraform

console.log(terraform);

/* {
	cacheDir: <path to terraform cache>
	version: <the version of Terraform that's loaded>
	executablePath: <the path to the terraform executable>
} */
```

I created this package specifically for use with Sonnetry (@c6fc/sonnetry), but perhaps someone else will find it useful.
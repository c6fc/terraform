# @c6fc/terraform

Link and use the Terraform binary with NPM.

## Usage

```sh
npm install -p @c6fc/terraform
```

Set the `tf_version` config element in your `package.json`:

```json
"config": {
	"tf_version": "0.15.4"
}
```

```javascript
const terraform = require('@c6fc/terraform'); // Install and link Terraform 0.15.4

console.log(terraform); 

/* {
	cacheDir: <path to terraform cache>
	version: <the version of Terraform that's loaded>
	executablePath: <the path to the terraform executable>
} */
```

I created this package specifically for use with Sonnetry (@c6fc/sonnetry), but perhaps someone else will find it useful.
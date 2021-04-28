function main(
  bucketName,
  prefix,
  outputDir,
) {
  const {Storage} = require("@google-cloud/storage");
  const path = require("path");
  const fs = require("fs");
  const md5File = require("md5-file");

  const storage = new Storage();

  async function listFilesByPrefix() {
    const [files] = await storage.bucket(bucketName).getFiles({prefix: prefix});
    console.log(`Found ${files.length} files`);
    return files;
  }

  async function checkExistsLocally(x, destination) {
    if (!fs.existsSync(destination)) return false;
    const md5LocalPromise = md5File(destination);
    const [{md5Hash}] = await x.getMetadata();
    const md5Local = Buffer.from(await md5LocalPromise, "hex").toString("base64");
    console.log(`Local checksum ${md5Local} vs. remote ${md5Hash}`);
    return md5Local === md5Hash;
  }

  async function maybeDownload(x) {
    const destination = path.join(outputDir, path.relative(prefix, x.name))
    if (await checkExistsLocally(x, destination)) {
      console.log(`File ${x.name} already exists locally as ${destination}`)
      return;
    }
    console.log(`Downloading file ${x.name} to ${destination}`)
    return x.download({
      destination: destination
    })
  }

  async function downloadByPrefix() {
    const files = await listFilesByPrefix();
    return Promise.all(files.map(maybeDownload))
  }

  downloadByPrefix().catch(console.log);
}

main(...process.argv.slice(2));

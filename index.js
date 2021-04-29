function main(
  bucketName,
  prefix,
  outputDir,
) {
  const {Storage} = require("@google-cloud/storage");
  const path = require("path");
  const fs = require("fs");

  const storage = new Storage();

  async function listFilesByPrefix() {
    const [filesAndFolders] = await storage.bucket(bucketName).getFiles({prefix: prefix});
    const files = filesAndFolders.filter(x => !x.name.endsWith("/"));
    console.log(`Found ${files.length} file(s): ${files.map(x => x.name).join(",")}`);
    return files;
  }

  async function checkExistsLocally(md5Hash, md5Destination) {
    if (!fs.existsSync(md5Destination)) return false;
    const md5Local = await fs.promises.readFile(md5Destination, {encoding: "utf-8"});
    console.log(`Local checksum ${md5Local} vs. remote ${md5Hash}`);
    return md5Local === md5Hash;
  }

  async function maybeCreateParentDirectory(name) {
    const dirname = path.dirname(name);
    if(!fs.existsSync(dirname)) await fs.promises.mkdir(dirname, {recursive: true});
  }

  async function maybeDownload(x) {
    const relativeName = path.relative(prefix, x.name);
    const destination = path.join(outputDir, relativeName);
    const md5Destination = path.join(outputDir, '.gcs-checksum', relativeName);
    const [{md5Hash}] = await x.getMetadata();
    if (await checkExistsLocally(md5Hash, md5Destination)) {
      console.log(`File ${x.name} already exists locally as ${destination}`)
      return;
    }
    console.log(`Downloading file ${x.name} to ${destination}`);
    await maybeCreateParentDirectory(destination);
    await x.download({
      destination: destination
    })
    await maybeCreateParentDirectory(md5Destination);
    await fs.promises.writeFile(md5Destination, md5Hash);
  }

  async function downloadByPrefix() {
    const files = await listFilesByPrefix();
    return Promise.all(files.map(maybeDownload))
  }

  downloadByPrefix().catch(console.log);
}

main(...process.argv.slice(2));

# GCS Blob Downloader

## Usage

To download all files under a prefix (`PATH_PREFIX`) in a GCS bucket (`BUCKET_NAME`) run it like this:

```
docker run \
    -v $PWD/service-account.json:/service-account.json \
    -e GOOGLE_APPLICATION_CREDENTIALS=/svc.json \
    -v $PWD/output/:/output \
    antifriz/gcs-blob-downloader \
    BUCKET_NAME \
    PATH_PREFIX \
    /output
```

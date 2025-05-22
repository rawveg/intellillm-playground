# Installation & Deployment

[← Back to Main README](../README.md) | [Features](./features.md) | [Parameters](./parameters.md) | [File Attachments](./file-attachments.md) | [Web Search](./web-search.md) | [API Reference](./api-reference.md) | [Contributing](./contributing.md)

---

IntelliLLM Playground can be installed and deployed in several ways, depending on your needs.

## Docker Installation (Recommended)

The fastest and most reliable way to use IntelliLLM Playground is via Docker:

```bash
# 1. Clone the repo
$ git clone https://github.com/rawveg/intellillm-playground.git
$ cd intellillm-playground

# 2. Build the Docker image
$ docker build -t intellillm-playground .

# 3. Run the container (serves on port 3000)
$ docker run -p 3000:3000 -v /path/to/your/prompts:/app/prompts intellillm-playground
```

**Tip:** Mount your prompt directory (`-v /path/to/your/prompts:/app/prompts`) for persistent prompt storage.

## Local Development Setup

If you wish to contribute or run the app natively (not recommended for production):

```bash
# 1. Clone the repo
$ git clone https://github.com/rawveg/intellillm-playground.git
$ cd intellillm-playground

# 2. Install dependencies
$ npm install

# 3. Start the dev server
$ npm run dev

# 4. Access the app
$ open http://localhost:3000
```

## Google Cloud Run Deployment

1. **Build and tag the Docker image:**
   ```bash
   docker build -t gcr.io/PROJECT_ID/intellillm-playground:latest .
   ```
2. **Push the image to Google Container Registry:**
   ```bash
   docker push gcr.io/PROJECT_ID/intellillm-playground:latest
   ```

3. **Set up a Cloud Storage bucket for persistent prompt storage:**
   ```bash
   # Create a new bucket (skip if using an existing bucket)
   gsutil mb -l REGION gs://YOUR_BUCKET_NAME
   
   # Create a service account for Cloud Run to access the bucket
   gcloud iam service-accounts create intellillm-storage-sa \
     --display-name="IntelliLLM Storage Service Account"
   
   # Grant the service account access to the bucket
   gsutil iam ch serviceAccount:intellillm-storage-sa@PROJECT_ID.iam.gserviceaccount.com:objectAdmin gs://YOUR_BUCKET_NAME
   ```

4. **Deploy to Cloud Run with the bucket mounted:**
   ```bash
   gcloud run deploy intellillm-playground \
     --image gcr.io/PROJECT_ID/intellillm-playground:latest \
     --platform managed \
     --region REGION \
     --allow-unauthenticated \
     --port 3000 \
     --service-account intellillm-storage-sa@PROJECT_ID.iam.gserviceaccount.com \
     --update-env-vars BUCKET_NAME=YOUR_BUCKET_NAME \
     --update-env-vars MOUNT_PATH=/app/prompts
   ```
   
   Replace:
   - `PROJECT_ID` with your GCP project ID
   - `REGION` with your preferred region (e.g., `us-central1`)
   - `YOUR_BUCKET_NAME` with your Cloud Storage bucket name

5. **Add Cloud Storage FUSE configuration:**
   
   Create a file named `fuse-config.json`:
   ```json
   {
     "type": "service_account",
     "bucket": "YOUR_BUCKET_NAME",
     "mountPoint": "/app/prompts"
   }
   ```
   
   Update your deployment to include the FUSE configuration:
   ```bash
   gcloud run services update intellillm-playground \
     --region REGION \
     --add-volume name=fuse-config,type=secret,secret=fuse-config,mount-path=/etc/fuse \
     --add-volume name=prompts-volume,type=cloud-storage-fuse,bucket=YOUR_BUCKET_NAME,mount-path=/app/prompts
   ```

This setup ensures that your prompts are stored in a persistent Cloud Storage bucket, allowing them to survive container restarts, redeployments, and scaling events. The prompts will be available at the standard `/app/prompts` path within the container, maintaining compatibility with the application's expected directory structure.

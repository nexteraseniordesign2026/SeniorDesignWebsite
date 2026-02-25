# S3 Image Access Setup (Captures Folder Only)

This guide configures your S3 bucket so **only the image folder** (`captures/`) is publicly readable. Inference results, GPS data, and other objects remain private.

## Bucket Structure

| Prefix | Contents | Access |
|--------|----------|--------|
| `captures/` | Images from Raspberry Pi / fleet devices | **Public read** (for dashboard display) |
| `inference_results/` | AI inference JSON | Private |
| `gps_data/` | GPS metadata JSON | Private |

## Steps

### 1. Disable "Block all public access"

1. Open **AWS Console** → **S3** → your bucket (e.g. `nextera-pipeline-2025`)
2. **Permissions** tab
3. **Block public access** → **Edit**
4. Uncheck **"Block all public access"**
5. Confirm and save

### 2. Add a Bucket Policy (scoped to `captures/`)

1. Same bucket → **Permissions** → **Bucket policy** → **Edit**
2. Paste this policy (replace `YOUR-BUCKET-NAME` with your bucket, e.g. `nextera-pipeline-2025`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadCapturesOnly",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/captures/*"
        }
    ]
}
```

3. **Save changes**

Only objects under `captures/*` are now publicly readable. `inference_results/` and `gps_data/` stay private.

### 3. Verify

- Public image test: `https://YOUR-BUCKET-NAME.s3.us-east-2.amazonaws.com/captures/raspberry_pi/cam0/20260203_175034.jpg`
- Replace with a real key from your DynamoDB data. It should load in a browser.
- A private path like `inference_results/...` should return Access Denied.

### 4. Object ACLs (Optional)

If images still don’t load:

1. Open the object in S3
2. **Actions** → **Make public using ACL** (if supported)
3. Or ensure the bucket policy above is the only source of public access (no conflicting block rules)

## Region

The website uses `us-east-2` for S3 URLs. Confirm your bucket is in `us-east-2`. If it’s in another region, update `getImageUrl` in `dynamodb-service.js` to use that region (e.g. `s3.us-west-2.amazonaws.com`).

## Security Notes

- Public access is limited to the `captures/` prefix.
- Anyone with a URL to an image in `captures/` can view it; URLs are not secret.
- For stricter control, use [presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html) instead and keep the bucket fully private.

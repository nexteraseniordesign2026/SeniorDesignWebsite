# DynamoDB Integration Setup Guide

This guide explains how to set up the DynamoDB integration for the IVVM System website.

## Overview

The website now fetches location data from a DynamoDB table instead of using hardcoded data. The integration requires:

1. A DynamoDB table with the specified schema
2. An API Gateway endpoint that queries DynamoDB
3. A Lambda function (optional, but recommended) to handle queries

## DynamoDB Table Schema

### Table Structure
- **Table Name**: (Your choice, e.g., `ivvm-captures`)
- **Partition Key**: `capture_id` (String)
- **Sort Key**: `capture_timestamp` (String, ISO 8601 format)

### Required Attributes
- `capture_id` (String) - Format: `{device_name}_{timestamp}`
- `capture_timestamp` (String) - ISO 8601 format: `2026-02-03T17:50:34Z`
- `device_name` (String)
- `latitude` (Number)
- `longitude` (Number)
- `predicted_class` (String) - One of: `'no_vegetation'`, `'little_vegetation'`, `'lot_vegetation'`, `'back_of_panel'`
- `confidence` (Number) - 0.0 to 1.0
- `altitude` (Number, optional)
- `image_s3_key` (String, optional)
- `image_s3_bucket` (String, optional)
- `gps_status` (String, optional)
- `num_satellites` (Number, optional)

## API Gateway Setup

### Option 1: API Gateway with Lambda (Recommended)

1. **Create a Lambda Function** that queries DynamoDB:

```python
import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ivvm-captures')  # Replace with your table name

def lambda_handler(event, context):
    try:
        # Get query parameters
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 100))
        device_name = params.get('device_name')
        
        # Query DynamoDB
        if device_name:
            # Query by device name (using GSI if available)
            response = table.query(
                IndexName='device_name-index',  # Create GSI if needed
                KeyConditionExpression='device_name = :dn',
                ExpressionAttributeValues={':dn': device_name},
                Limit=limit,
                ScanIndexForward=False  # Most recent first
            )
        else:
            # Scan table (less efficient, but works without GSI)
            response = table.scan(
                Limit=limit
            )
        
        items = response.get('Items', [])
        
        # Sort by timestamp (most recent first)
        items.sort(key=lambda x: x.get('capture_timestamp', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'  # Configure CORS properly in production
            },
            'body': json.dumps({
                'items': items[:limit],
                'count': len(items)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
```

2. **Create API Gateway REST API**:
   - Create a new REST API
   - Create a GET method on `/locations`
   - Connect it to your Lambda function
   - Enable CORS
   - Deploy the API

3. **Get the API Endpoint URL**:
   - Copy the Invoke URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
   - Your full endpoint will be: `https://abc123.execute-api.us-east-1.amazonaws.com/prod/locations`

### Option 2: Direct DynamoDB Access (Not Recommended for Production)

**Note**: This is not recommended as it exposes AWS credentials. Use only for development.

You would need to:
1. Use AWS Cognito for authentication
2. Configure IAM roles with proper permissions
3. Use AWS SDK in the browser

## Configuration

1. **Update `config.js`**:
   ```javascript
   window.DYNAMODB_API_ENDPOINT = 'https://your-api-id.execute-api.region.amazonaws.com/stage/locations';
   ```

2. **For GitHub Pages**, add the endpoint to your GitHub Secrets:
   - Go to repository Settings > Secrets > Actions
   - Add secret: `DYNAMODB_API_ENDPOINT`
   - Update your GitHub Actions workflow to inject it into `config.js`

## API Response Format

The API should return JSON in this format:

```json
{
  "items": [
    {
      "capture_id": "raspberry_pi_20260203_175034",
      "capture_timestamp": "2026-02-03T17:50:34Z",
      "device_name": "raspberry_pi",
      "latitude": 38.921574,
      "longitude": -83.123456,
      "altitude": 250.5,
      "predicted_class": "back_of_panel",
      "confidence": 0.5306,
      "all_probabilities": {
        "back_of_panel": 0.5306,
        "no_vegetation": 0.2500,
        "little_vegetation": 0.1500,
        "lot_vegetation": 0.0694
      },
      "image_s3_key": "captures/raspberry_pi/cam0/20260203_175034.jpg",
      "image_s3_bucket": "nextera-pipeline-2025",
      "gps_status": "fix_acquired",
      "num_satellites": 8
    }
  ],
  "count": 1
}
```

## Query Parameters

The API supports the following query parameters:

- `limit` (number): Maximum number of items to return (default: 100)
- `device_name` (string): Filter by device name (optional)
- `start_timestamp` (string): Start time for range query (optional)
- `end_timestamp` (string): End time for range query (optional)

Example:
```
GET /locations?limit=50&device_name=raspberry_pi
```

## Risk Level Mapping

The frontend automatically maps `predicted_class` to risk levels:

- `'no_vegetation'` → LOW
- `'little_vegetation'` → LOW
- `'lot_vegetation'` → MEDIUM
- `'back_of_panel'` → HIGH

## Testing

1. **Test the API directly**:
   ```bash
   curl "https://your-api-endpoint/locations?limit=10"
   ```

2. **Test in browser console**:
   ```javascript
   const service = new DynamoDBService('https://your-api-endpoint/locations');
   service.fetchLocations({ limit: 10 }).then(console.log);
   ```

## Troubleshooting

### CORS Errors
- Ensure your API Gateway has CORS enabled
- Check that the `Access-Control-Allow-Origin` header is set correctly

### No Data Showing
- Check browser console for errors
- Verify the API endpoint is correct in `config.js`
- Test the API endpoint directly with curl or Postman
- Check that DynamoDB table has data

### Map Not Updating
- Ensure Google Maps API is loaded
- Check that `loadLocations()` is being called
- Verify data format matches expected schema

## Security Considerations

1. **API Gateway**: Use API keys or IAM authentication
2. **CORS**: Restrict CORS to your domain in production
3. **Rate Limiting**: Implement rate limiting on API Gateway
4. **Data Filtering**: Don't expose sensitive data unnecessarily

## Next Steps

1. Set up your DynamoDB table
2. Create the Lambda function
3. Deploy API Gateway
4. Update `config.js` with your endpoint
5. Test the integration


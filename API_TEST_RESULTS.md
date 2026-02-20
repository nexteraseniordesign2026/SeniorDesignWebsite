# API Test Results

## API Endpoint Tested
```
https://oho7x3vnc0.execute-api.us-east-2.amazonaws.com/dev/locations
```

## Test Results

### ✅ API Gateway is Working
- **Status**: API Gateway endpoint is accessible
- **CORS**: Properly configured (allows `*` origin)
- **Methods**: GET and OPTIONS are available
- **Response Time**: ~1 second

### ⚠️ DynamoDB Table Issue
- **Error**: `ResourceNotFoundException: Requested resource not found`
- **Status Code**: 500
- **Meaning**: The Lambda function cannot find the DynamoDB table

## What's Working

1. ✅ API Gateway endpoint is correctly configured
2. ✅ CORS headers are properly set
3. ✅ Lambda function is responding
4. ✅ Error handling is working (returns proper error messages)
5. ✅ Configuration updated in `config.js`

## What Needs to be Fixed

The Lambda function needs access to the DynamoDB table. Check:

1. **DynamoDB Table Exists**
   - Verify the table name in your Lambda function matches the actual table name
   - Common table names: `ivvm-captures`, `captures`, `vegetation-data`

2. **Lambda Function Permissions**
   - Ensure the Lambda execution role has `dynamodb:Scan` and `dynamodb:Query` permissions
   - Check IAM role attached to the Lambda function

3. **Table Name in Lambda Code**
   - The Lambda function should have the correct table name hardcoded
   - Example: `table = dynamodb.Table('your-table-name')`

4. **Region**
   - Ensure the DynamoDB table is in the same region as the Lambda function (us-east-2)

## Current Configuration

The endpoint has been configured in `config.js`:
```javascript
window.DYNAMODB_API_ENDPOINT = 'https://oho7x3vnc0.execute-api.us-east-2.amazonaws.com/dev/locations';
```

## Testing

You can test the API using:

1. **Browser Test**: Open `test-api.html` in your browser
2. **Command Line**: 
   ```bash
   curl "https://oho7x3vnc0.execute-api.us-east-2.amazonaws.com/dev/locations?limit=5"
   ```
3. **Website**: The main website will automatically use this endpoint once the DynamoDB table is accessible

## Expected Response Format

Once the table is accessible, the API should return:
```json
{
  "items": [
    {
      "capture_id": "raspberry_pi_20260203_175034",
      "capture_timestamp": "2026-02-03T17:50:34Z",
      "device_name": "raspberry_pi",
      "latitude": 38.921574,
      "longitude": -83.123456,
      "predicted_class": "back_of_panel",
      "confidence": 0.5306,
      ...
    }
  ],
  "count": 1
}
```

## Next Steps

1. Verify DynamoDB table exists and is accessible
2. Check Lambda function code for correct table name
3. Verify Lambda execution role has DynamoDB permissions
4. Test again using `test-api.html` or the main website


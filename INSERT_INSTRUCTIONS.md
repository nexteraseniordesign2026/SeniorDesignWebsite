# Instructions to Insert Mock Data into DynamoDB

## Current Situation

Your AWS user doesn't have direct DynamoDB write permissions. You'll need one of the following:

## Option 1: Get Admin to Run the Script (Recommended)

1. **Share these files with someone who has DynamoDB admin access:**
   - `dynamodb-mock-data.json` (the data)
   - `insert-mock-data.py` (the insertion script)

2. **They should run:**
   ```bash
   python3 insert-mock-data.py --table-name YOUR_TABLE_NAME --region us-east-2
   ```
   
   Replace `YOUR_TABLE_NAME` with the actual table name.

## Option 2: Request IAM Permissions

Ask your AWS administrator to add these permissions to your IAM user:
- `dynamodb:PutItem`
- `dynamodb:DescribeTable` (optional, for verification)

## Option 3: Use AWS Console (Manual)

1. Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Select your table in `us-east-2` region
3. Click "Explore table items"
4. Click "Create item"
5. For each item in `dynamodb-mock-data.json`:
   - Click "Create item"
   - Manually enter each field
   - Click "Save"

## Option 4: Use AWS CLI with Admin Credentials

If you have admin credentials (temporary or different account):

```bash
# Install boto3 if needed
pip install boto3

# Run the script
python3 insert-mock-data.py --table-name YOUR_TABLE_NAME --region us-east-2
```

## Finding Your Table Name

The table name should be in your Lambda function code. Check:
1. Lambda function in AWS Console
2. Look for line like: `table = dynamodb.Table('table-name')`

Common names:
- `ivvm-captures`
- `captures`
- `vegetation-captures`
- `nextera-captures`

## Verify Data After Insertion

Test your API:
```bash
curl "https://oho7x3vnc0.execute-api.us-east-2.amazonaws.com/dev/locations?limit=10"
```

You should see your 10 items returned!

## Data Summary

The mock data file contains **10 items** with:
- 4 different devices: `raspberry_pi`, `device_001`, `device_002`, `vehicle_alpha`
- All 4 predicted classes: `no_vegetation`, `little_vegetation`, `lot_vegetation`, `back_of_panel`
- Various confidence levels and GPS coordinates
- Timestamps from 2026-02-03 17:50 to 19:45



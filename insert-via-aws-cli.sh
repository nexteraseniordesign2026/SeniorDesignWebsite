#!/bin/bash
# Script to insert mock data using AWS CLI
# Requires: AWS CLI configured with DynamoDB write permissions

TABLE_NAME="${1:-ivvm-captures}"  # Default to ivvm-captures if not provided
REGION="${2:-us-east-2}"

echo "📦 Preparing to insert data into table: $TABLE_NAME"
echo "📍 Region: $REGION"
echo ""

# Convert JSON to AWS CLI batch-write format
python3 << 'PYTHON_SCRIPT'
import json
from decimal import Decimal

def convert_value(value):
    """Convert Python value to DynamoDB format"""
    if isinstance(value, float):
        return {"N": str(value)}
    elif isinstance(value, int):
        return {"N": str(value)}
    elif isinstance(value, str):
        return {"S": value}
    elif isinstance(value, bool):
        return {"BOOL": value}
    elif isinstance(value, dict):
        return {"M": {k: convert_value(v) for k, v in value.items()}}
    elif isinstance(value, list):
        return {"L": [convert_value(v) for v in value]}
    else:
        return {"S": str(value)}

# Load data
with open('dynamodb-mock-data.json', 'r') as f:
    items = json.load(f)

# Convert to batch write format
batch_items = []
for item in items:
    dynamodb_item = {k: convert_value(v) for k, v in item.items() if v is not None}
    batch_items.append({"PutRequest": {"Item": dynamodb_item}})

# Split into batches of 25 (DynamoDB limit)
batch_size = 25
for i in range(0, len(batch_items), batch_size):
    batch = batch_items[i:i+batch_size]
    batch_data = {TABLE_NAME: batch}
    
    print(f"Batch {i//batch_size + 1}: {len(batch)} items")
    print(json.dumps({"RequestItems": batch_data}, indent=2))
    print("---")

PYTHON_SCRIPT

echo ""
echo "✅ Data conversion complete!"
echo ""
echo "To insert the data, run:"
echo "  aws dynamodb batch-write-item --request-items file://batch-request.json --region $REGION"
echo ""
echo "Or use the Python script with admin credentials."



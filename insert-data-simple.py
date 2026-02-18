#!/usr/bin/env python3
"""Simple script to insert data - requires table name as argument"""
import json
import boto3
import sys
from decimal import Decimal

if len(sys.argv) < 2:
    print("Usage: python3 insert-data-simple.py TABLE_NAME")
    print("Example: python3 insert-data-simple.py ivvm-captures")
    sys.exit(1)

TABLE_NAME = sys.argv[1]
REGION = 'us-east-2'

# Load data
with open('dynamodb-mock-data.json', 'r') as f:
    items = json.load(f)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

print(f"🚀 Inserting {len(items)} items into '{TABLE_NAME}'...\n")

success = 0
errors = 0

for item in items:
    try:
        # Convert to DynamoDB format
        dynamodb_item = {}
        for key, value in item.items():
            if isinstance(value, dict):
                dynamodb_item[key] = {k: Decimal(str(v)) if isinstance(v, float) else v 
                                     for k, v in value.items()}
            elif isinstance(value, float):
                dynamodb_item[key] = Decimal(str(value))
            elif isinstance(value, (int, str, bool)):
                dynamodb_item[key] = value
        
        table.put_item(Item=dynamodb_item)
        print(f"✅ {item['capture_id']}")
        success += 1
    except Exception as e:
        print(f"❌ {item['capture_id']}: {str(e)}")
        errors += 1

print(f"\n📊 Done! Success: {success}, Errors: {errors}")

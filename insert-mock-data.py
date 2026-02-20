#!/usr/bin/env python3
"""
Script to insert mock data into DynamoDB table
Usage: python3 insert-mock-data.py --table-name YOUR_TABLE_NAME --region us-east-2
"""

import json
import boto3
import argparse
from decimal import Decimal

def decimal_default(obj):
    """Convert float to Decimal for DynamoDB"""
    if isinstance(obj, float):
        return Decimal(str(obj))
    raise TypeError

def load_mock_data(file_path='dynamodb-mock-data.json'):
    """Load mock data from JSON file"""
    with open(file_path, 'r') as f:
        return json.load(f)

def convert_to_dynamodb_format(item):
    """Convert JSON item to DynamoDB format"""
    dynamodb_item = {}
    
    for key, value in item.items():
        if isinstance(value, dict):
            # Handle nested objects (like all_probabilities)
            dynamodb_item[key] = {k: Decimal(str(v)) if isinstance(v, float) else v 
                                 for k, v in value.items()}
        elif isinstance(value, float):
            dynamodb_item[key] = Decimal(str(value))
        elif isinstance(value, (int, str, bool)):
            dynamodb_item[key] = value
        elif value is None:
            # Skip None values
            continue
        else:
            dynamodb_item[key] = value
    
    return dynamodb_item

def insert_items(table, items):
    """Insert items into DynamoDB table"""
    success_count = 0
    error_count = 0
    
    for item in items:
        try:
            dynamodb_item = convert_to_dynamodb_format(item)
            table.put_item(Item=dynamodb_item)
            print(f"✅ Inserted: {item['capture_id']}")
            success_count += 1
        except Exception as e:
            print(f"❌ Error inserting {item['capture_id']}: {str(e)}")
            error_count += 1
    
    return success_count, error_count

def main():
    parser = argparse.ArgumentParser(description='Insert mock data into DynamoDB')
    parser.add_argument('--table-name', required=True, help='DynamoDB table name')
    parser.add_argument('--region', default='us-east-2', help='AWS region (default: us-east-2)')
    parser.add_argument('--data-file', default='dynamodb-mock-data.json', 
                       help='Path to JSON data file (default: dynamodb-mock-data.json)')
    
    args = parser.parse_args()
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name=args.region)
    table = dynamodb.Table(args.table_name)
    
    # Check if table exists
    try:
        table.load()
        print(f"✅ Table '{args.table_name}' found")
    except Exception as e:
        print(f"❌ Error accessing table: {str(e)}")
        print("Make sure the table exists and you have proper permissions.")
        return
    
    # Load mock data
    try:
        items = load_mock_data(args.data_file)
        print(f"📦 Loaded {len(items)} items from {args.data_file}")
    except FileNotFoundError:
        print(f"❌ File not found: {args.data_file}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {str(e)}")
        return
    
    # Insert items
    print(f"\n🚀 Inserting {len(items)} items into table '{args.table_name}'...\n")
    success_count, error_count = insert_items(table, items)
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully inserted: {success_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📝 Total: {len(items)}")

if __name__ == '__main__':
    main()


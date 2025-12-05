import json
import boto3
import os
import urllib3

# Initialize clients
ecs = boto3.client('ecs')
elbv2 = boto3.client('elbv2')
dynamodb = boto3.resource('dynamodb')

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

http = urllib3.PoolManager()

def update_supabase_workspace(student_id, status=None, url=None):
    """Update workspace status in Supabase"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Supabase not configured, skipping update")
        return False
    
    try:
        update_data = {
            'workspace_status': status,
            'workspace_url': url
        }
        
        headers = {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        response = http.request(
            'PATCH',
            f"{SUPABASE_URL}/rest/v1/students?id=eq.{student_id}",
            body=json.dumps(update_data).encode('utf-8'),
            headers=headers
        )
        
        print(f"Supabase update response: {response.status}")
        return response.status in [200, 204]
    except Exception as e:
        print(f"Error updating Supabase: {str(e)}")
        return False

def cleanup_alb_resources(student_id, workspace_data):
    """Delete ALB rule and target group for terminated workspace"""
    try:
        # Delete ALB rule
        rule_arn = workspace_data.get('rule_arn', {}).get('S', '')
        if rule_arn:
            try:
                elbv2.delete_rule(RuleArn=rule_arn)
                print(f"Deleted ALB rule: {rule_arn}")
            except Exception as e:
                print(f"Error deleting rule: {str(e)}")
        
        # Delete target group
        tg_arn = workspace_data.get('target_group_arn', {}).get('S', '')
        if tg_arn:
            try:
                elbv2.delete_target_group(TargetGroupArn=tg_arn)
                print(f"Deleted target group: {tg_arn}")
            except Exception as e:
                print(f"Error deleting target group: {str(e)}")
    except Exception as e:
        print(f"Error in cleanup: {str(e)}")

def lambda_handler(event, context):
    """
    Handles ECS task state change events.
    When a codeserver task stops, cleans up resources and updates Supabase.
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        detail = event.get('detail', {})
        
        # Only process STOPPED tasks
        if detail.get('lastStatus') != 'STOPPED':
            print(f"Ignoring non-STOPPED event: {detail.get('lastStatus')}")
            return {'statusCode': 200, 'body': 'Ignored'}
        
        # Only process codeserver tasks
        task_def_arn = detail.get('taskDefinitionArn', '')
        if 'codeserver' not in task_def_arn.lower():
            print(f"Ignoring non-codeserver task: {task_def_arn}")
            return {'statusCode': 200, 'body': 'Ignored'}
        
        task_arn = detail.get('taskArn', '')
        stop_code = detail.get('stopCode', '')
        stopped_reason = detail.get('stoppedReason', '')
        
        print(f"Task stopped: {task_arn}")
        print(f"Stop code: {stop_code}, Reason: {stopped_reason}")
        
        # Find student_id from task tags or DynamoDB
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        
        # Scan DynamoDB for the task ARN
        response = table.scan(
            FilterExpression='task_arn = :arn',
            ExpressionAttributeValues={':arn': task_arn}
        )
        
        if not response.get('Items'):
            print(f"No workspace found for task: {task_arn}")
            return {'statusCode': 200, 'body': 'No workspace found'}
        
        workspace = response['Items'][0]
        student_id = workspace['student_id']
        
        print(f"Found workspace for student: {student_id}")
        
        # Clean up ALB resources
        cleanup_alb_resources(student_id, workspace)
        
        # Delete from DynamoDB
        table.delete_item(Key={'student_id': student_id})
        print(f"Deleted DynamoDB record for: {student_id}")
        
        # Update Supabase - clear workspace status
        update_supabase_workspace(student_id, status=None, url=None)
        print(f"Cleared Supabase workspace for: {student_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Workspace cleaned up',
                'student_id': student_id,
                'stop_code': stop_code
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

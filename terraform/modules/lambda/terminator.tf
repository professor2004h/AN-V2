# ============================================
# WORKSPACE TERMINATOR LAMBDA
# Terminates inactive workspaces after timeout
# ============================================

data "archive_file" "terminator" {
  type        = "zip"
  output_path = "${path.module}/lambda_functions/terminator.zip"

  source {
    content  = <<-EOF
import json
import boto3
import os
import time

ecs = boto3.client('ecs')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """
    Terminates inactive Code-Server workspaces.
    Triggers: scheduled event, user logout, browser close
    """
    try:
        # Handle different trigger types
        if 'student_id' in event:
            # Direct termination request
            return terminate_workspace(event['student_id'])
        else:
            # Scheduled check for inactive workspaces
            return check_and_terminate_inactive()
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def terminate_workspace(student_id):
    """Terminate a specific student's workspace"""
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    
    # Get workspace info
    response = table.get_item(Key={'student_id': student_id})
    
    if 'Item' not in response:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Workspace not found'})
        }
    
    workspace = response['Item']
    task_arn = workspace.get('task_arn')
    
    if task_arn:
        # Stop ECS task
        try:
            ecs.stop_task(
                cluster=os.environ['ECS_CLUSTER'],
                task=task_arn,
                reason='User logout or inactivity timeout'
            )
        except Exception as e:
            print(f"Error stopping task: {e}")
    
    # Update DynamoDB
    table.update_item(
        Key={'student_id': student_id},
        UpdateExpression='SET #status = :status, terminated_at = :time',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': 'terminated',
            ':time': int(time.time())
        }
    )
    
    # Publish metric
    cloudwatch.put_metric_data(
        Namespace='Apranova/Workspaces',
        MetricData=[{
            'MetricName': 'WorkspaceTerminations',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': [
                {'Name': 'Reason', 'Value': 'user_action'}
            ]
        }]
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'terminated', 'student_id': student_id})
    }

def check_and_terminate_inactive():
    """Check all workspaces and terminate inactive ones"""
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
    inactivity_threshold = int(os.environ.get('INACTIVITY_TIMEOUT', 900))  # 15 min default
    
    # Scan for running workspaces
    response = table.scan(
        FilterExpression='#status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'running'}
    )
    
    terminated_count = 0
    current_time = int(time.time())
    
    for workspace in response.get('Items', []):
        last_activity = workspace.get('last_activity', workspace.get('created_at', 0))
        
        if current_time - last_activity > inactivity_threshold:
            result = terminate_workspace(workspace['student_id'])
            if result['statusCode'] == 200:
                terminated_count += 1
    
    # Publish metrics
    cloudwatch.put_metric_data(
        Namespace='Apranova/Workspaces',
        MetricData=[{
            'MetricName': 'InactiveWorkspacesTerminated',
            'Value': terminated_count,
            'Unit': 'Count'
        }]
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'terminated_count': terminated_count,
            'checked_at': current_time
        })
    }
EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "terminator" {
  filename         = data.archive_file.terminator.output_path
  function_name    = "${var.project_name}-${var.environment}-workspace-terminator"
  role             = aws_iam_role.lambda.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.terminator.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 256

  vpc_config {
    subnet_ids         = var.private_subnets
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ECS_CLUSTER        = var.ecs_cluster_name
      DYNAMODB_TABLE     = aws_dynamodb_table.workspaces.name
      INACTIVITY_TIMEOUT = tostring(var.workspace_inactivity_timeout * 60)
    }
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.terminator]
}

# CloudWatch Event Rule - Check every 5 minutes
resource "aws_cloudwatch_event_rule" "check_inactive" {
  name                = "${var.project_name}-${var.environment}-check-inactive-workspaces"
  description         = "Check for inactive workspaces every 5 minutes"
  schedule_expression = "rate(5 minutes)"

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "check_inactive" {
  rule      = aws_cloudwatch_event_rule.check_inactive.name
  target_id = "workspace-terminator"
  arn       = aws_lambda_function.terminator.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terminator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.check_inactive.arn
}


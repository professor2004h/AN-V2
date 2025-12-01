# ============================================
# WORKSPACE PROVISIONER LAMBDA
# Creates new Code-Server containers for students
# ============================================

data "archive_file" "provisioner" {
  type        = "zip"
  output_path = "${path.module}/lambda_functions/provisioner.zip"

  source {
    content  = <<-EOF
import json
import boto3
import os
import time
import uuid

ecs = boto3.client('ecs')
elbv2 = boto3.client('elbv2')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Provisions a new Code-Server workspace for a student.
    Returns workspace URL after task is healthy.
    """
    try:
        body = json.loads(event.get('body', '{}'))
        student_id = body.get('student_id')
        
        if not student_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'student_id is required'})
            }
        
        # Check if workspace already exists
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        existing = table.get_item(Key={'student_id': student_id})
        
        if 'Item' in existing and existing['Item'].get('status') == 'running':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'workspace_url': existing['Item']['workspace_url'],
                    'status': 'existing'
                })
            }
        
        # Generate workspace identifiers
        workspace_id = str(uuid.uuid4())[:8]
        short_id = student_id[:8]
        
        # Run ECS task
        response = ecs.run_task(
            cluster=os.environ['ECS_CLUSTER'],
            taskDefinition=os.environ['TASK_DEFINITION'],
            count=1,
            launchType='FARGATE',
            networkConfiguration={
                'awsvpcConfiguration': {
                    'subnets': os.environ['SUBNETS'].split(','),
                    'securityGroups': [os.environ['SECURITY_GROUP']],
                    'assignPublicIp': 'DISABLED'
                }
            },
            overrides={
                'containerOverrides': [{
                    'name': 'codeserver',
                    'environment': [
                        {'name': 'STUDENT_ID', 'value': student_id},
                        {'name': 'WORKSPACE_ID', 'value': workspace_id}
                    ]
                }]
            },
            capacityProviderStrategy=[
                {'capacityProvider': 'FARGATE_SPOT', 'weight': 4, 'base': 0},
                {'capacityProvider': 'FARGATE', 'weight': 1, 'base': 0}
            ],
            tags=[
                {'key': 'StudentId', 'value': student_id},
                {'key': 'WorkspaceId', 'value': workspace_id}
            ]
        )
        
        task_arn = response['tasks'][0]['taskArn']
        
        # Wait for task to be running and get IP
        max_wait = 120
        waited = 0
        task_ip = None
        
        while waited < max_wait:
            time.sleep(5)
            waited += 5
            
            task_info = ecs.describe_tasks(
                cluster=os.environ['ECS_CLUSTER'],
                tasks=[task_arn]
            )
            
            if task_info['tasks']:
                task = task_info['tasks'][0]
                if task['lastStatus'] == 'RUNNING':
                    for attachment in task.get('attachments', []):
                        for detail in attachment.get('details', []):
                            if detail['name'] == 'privateIPv4Address':
                                task_ip = detail['value']
                                break
                    if task_ip:
                        break
        
        if not task_ip:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Task failed to start'})
            }
        
        # Generate workspace URL
        workspace_url = f"https://ws-{short_id}.{os.environ['DOMAIN']}"
        
        # Store in DynamoDB
        table.put_item(Item={
            'student_id': student_id,
            'workspace_id': workspace_id,
            'task_arn': task_arn,
            'task_ip': task_ip,
            'workspace_url': workspace_url,
            'status': 'running',
            'created_at': int(time.time()),
            'ttl': int(time.time()) + 86400  # 24 hour TTL
        })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'workspace_url': workspace_url,
                'status': 'provisioned',
                'task_arn': task_arn
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "provisioner" {
  filename         = data.archive_file.provisioner.output_path
  function_name    = "${var.project_name}-${var.environment}-workspace-provisioner"
  role             = aws_iam_role.lambda.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.provisioner.output_base64sha256
  runtime          = "python3.11"
  timeout          = 180
  memory_size      = 256

  vpc_config {
    subnet_ids         = var.private_subnets
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ECS_CLUSTER     = var.ecs_cluster_name
      TASK_DEFINITION = var.codeserver_task_definition_arn
      SUBNETS         = join(",", var.private_subnets)
      SECURITY_GROUP  = var.codeserver_security_group_id
      DYNAMODB_TABLE  = aws_dynamodb_table.workspaces.name
      DOMAIN          = "ecombinators.com"
    }
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.provisioner]
}


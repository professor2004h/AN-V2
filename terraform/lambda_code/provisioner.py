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
    Returns workspace URL after task is healthy and registered with ALB.
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
            # Verify task is actually running
            task_arn = existing['Item'].get('task_arn')
            try:
                task_info = ecs.describe_tasks(
                    cluster=os.environ['ECS_CLUSTER'],
                    tasks=[task_arn]
                )
                if task_info['tasks'] and task_info['tasks'][0]['lastStatus'] == 'RUNNING':
                    return {
                        'statusCode': 200,
                        'body': json.dumps({
                            'workspace_url': existing['Item']['workspace_url'],
                            'status': 'running'
                        })
                    }
            except:
                # Task doesn't exist, clean up and provision new one
                table.delete_item(Key={'student_id': student_id})
        
        # Generate workspace identifiers
        workspace_id = str(uuid.uuid4())[:8]
        short_id = student_id[:8] if len(student_id) >= 8 else student_id
        
        # Run ECS task
        response = ecs.run_task(
            cluster=os.environ['ECS_CLUSTER'],
            taskDefinition=os.environ['TASK_DEFINITION'],
            count=1,
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
                        {'name': 'WORKSPACE_ID', 'value': workspace_id},
                        {'name': 'PASSWORD', 'value': 'apranova123'}
                    ]
                }]
            },
            capacityProviderStrategy=[
            {'capacityProvider': 'FARGATE', 'weight': 1, 'base': 1}
        ],
            tags=[
                {'key': 'StudentId', 'value': student_id},
                {'key': 'WorkspaceId', 'value': workspace_id}
            ]
        )
        
        task_arn = response['tasks'][0]['taskArn']
        print(f"Created task: {task_arn}")
        
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
                elif task['lastStatus'] in ['STOPPED', 'DEPROVISIONING']:
                    return {
                        'statusCode': 500,
                        'body': json.dumps({'error': 'Task failed to start'})
                    }
        
        if not task_ip:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Task failed to start within timeout'})
            }
        
        print(f"Task running with IP: {task_ip}")
        
        # Create target group for this workspace
        tg_name = f'ws-{workspace_id}'
        try:
            tg_response = elbv2.create_target_group(
                Name=tg_name,
                Protocol='HTTP',
                Port=8080,
                VpcId=os.environ['VPC_ID'],
                TargetType='ip',
                HealthCheckPath='/',
                HealthCheckIntervalSeconds=30,
                HealthCheckTimeoutSeconds=10,
                HealthyThresholdCount=2,
                UnhealthyThresholdCount=3,
                Matcher={'HttpCode': '200-399'},
                Tags=[
                    {'Key': 'StudentId', 'Value': student_id},
                    {'Key': 'WorkspaceId', 'Value': workspace_id}
                ]
            )
            tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
            print(f"Created target group: {tg_arn}")
        except Exception as e:
            print(f"Error creating target group: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'Failed to create target group: {str(e)}'})
            }
        
        # Register task IP with target group
        try:
            elbv2.register_targets(
                TargetGroupArn=tg_arn,
                Targets=[{'Id': task_ip, 'Port': 8080}]
            )
            print(f"Registered target: {task_ip}:8080")
        except Exception as e:
            print(f"Error registering target: {str(e)}")
            # Clean up target group
            elbv2.delete_target_group(TargetGroupArn=tg_arn)
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'Failed to register target: {str(e)}'})
            }
        
        # Get next available priority for ALB rule
        try:
            rules = elbv2.describe_rules(ListenerArn=os.environ['ALB_LISTENER_ARN'])
            priorities = [int(r['Priority']) for r in rules['Rules'] if r['Priority'] != 'default']
            next_priority = max(priorities) + 1 if priorities else 1
            print(f"Using priority: {next_priority}")
        except Exception as e:
            print(f"Error getting priorities: {str(e)}")
            next_priority = 1000 + int(time.time() % 10000)  # Fallback
        
        # Create ALB listener rule
        workspace_url = f"https://ws-{short_id}.{os.environ['DOMAIN']}"
        try:
            rule_response = elbv2.create_rule(
                ListenerArn=os.environ['ALB_LISTENER_ARN'],
                Conditions=[{
                    'Field': 'host-header',
                    'Values': [f'ws-{short_id}.{os.environ["DOMAIN"]}']
                }],
                Actions=[{
                    'Type': 'forward',
                    'TargetGroupArn': tg_arn
                }],
                Priority=next_priority,
                Tags=[
                    {'Key': 'StudentId', 'Value': student_id},
                    {'Key': 'WorkspaceId', 'Value': workspace_id}
                ]
            )
            rule_arn = rule_response['Rules'][0]['RuleArn']
            print(f"Created ALB rule: {rule_arn}")
        except Exception as e:
            print(f"Error creating ALB rule: {str(e)}")
            # Clean up
            elbv2.deregister_targets(TargetGroupArn=tg_arn, Targets=[{'Id': task_ip}])
            elbv2.delete_target_group(TargetGroupArn=tg_arn)
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'Failed to create ALB rule: {str(e)}'})
            }
        
        # Store in DynamoDB
        table.put_item(Item={
            'student_id': student_id,
            'workspace_id': workspace_id,
            'task_arn': task_arn,
            'task_ip': task_ip,
            'target_group_arn': tg_arn,
            'rule_arn': rule_arn,
            'workspace_url': workspace_url,
            'status': 'running',
            'created_at': int(time.time()),
            'ttl': int(time.time()) + 86400  # 24 hour TTL
        })
        
        print(f"Workspace provisioned: {workspace_url}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'workspace_url': workspace_url,
                'status': 'running',
                'task_arn': task_arn,
                'password': os.environ.get('CODE_SERVER_PASSWORD', 'apranova_secure_ide')
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

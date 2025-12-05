import json
import boto3
import os
import time

ecs = boto3.client('ecs')
elbv2 = boto3.client('elbv2')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        student_id = body.get('student_id')
        
        if not student_id:
            return response(400, {'error': 'student_id required'})
        
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        short_id = student_id[:8]
        service_name = f"ws-{short_id}"
        domain = os.environ['DOMAIN']
        workspace_url = f"https://{service_name}.{domain}"
        
        # Check if service already exists and is healthy
        try:
            existing = ecs.describe_services(
                cluster=os.environ['ECS_CLUSTER'],
                services=[service_name]
            )
            if existing['services'] and existing['services'][0]['status'] == 'ACTIVE':
                running_count = existing['services'][0]['runningCount']
                if running_count > 0:
                    return response(200, {'workspace_url': workspace_url, 'status': 'running'})
                # Service exists but not running, update desired count
                ecs.update_service(
                    cluster=os.environ['ECS_CLUSTER'],
                    service=service_name,
                    desiredCount=1
                )
                return response(200, {'workspace_url': workspace_url, 'status': 'starting'})
        except:
            pass
        
        # Create target group with stickiness for WebSocket
        tg_name = f"ws-{short_id}"[:32]
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
                TargetGroupAttributes=[
                    {'Key': 'stickiness.enabled', 'Value': 'true'},
                    {'Key': 'stickiness.type', 'Value': 'lb_cookie'},
                    {'Key': 'stickiness.lb_cookie.duration_seconds', 'Value': '86400'},
                    {'Key': 'deregistration_delay.timeout_seconds', 'Value': '30'}
                ]
            )
            tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
        except elbv2.exceptions.DuplicateTargetGroupNameException:
            tg_response = elbv2.describe_target_groups(Names=[tg_name])
            tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
        
        # Create ALB rule for HTTPS listener
        listener_arn = os.environ['ALB_LISTENER_ARN']
        rules = elbv2.describe_rules(ListenerArn=listener_arn)
        priorities = [int(r['Priority']) for r in rules['Rules'] if r['Priority'] != 'default']
        priority = max(priorities) + 1 if priorities else 100
        
        try:
            elbv2.create_rule(
                ListenerArn=listener_arn,
                Conditions=[{'Field': 'host-header', 'Values': [f"{service_name}.{domain}"]}],
                Actions=[{'Type': 'forward', 'TargetGroupArn': tg_arn}],
                Priority=priority
            )
        except:
            pass
        
        # Create ECS Service with STUDENT_ID environment variable override
        ecs.create_service(
            cluster=os.environ['ECS_CLUSTER'],
            serviceName=service_name,
            taskDefinition=os.environ['TASK_DEFINITION'],
            desiredCount=1,
            launchType='FARGATE',
            platformVersion='LATEST',
            networkConfiguration={
                'awsvpcConfiguration': {
                    'subnets': os.environ['SUBNETS'].split(','),
                    'securityGroups': [os.environ['SECURITY_GROUP']],
                    'assignPublicIp': 'DISABLED'
                }
            },
            loadBalancers=[{
                'targetGroupArn': tg_arn,
                'containerName': 'codeserver',
                'containerPort': 8080
            }],
            healthCheckGracePeriodSeconds=120,
            deploymentConfiguration={
                'maximumPercent': 200,
                'minimumHealthyPercent': 100
            },
            enableExecuteCommand=True,
            tags=[
                {'key': 'StudentId', 'value': student_id},
                {'key': 'Environment', 'value': 'production'},
                {'key': 'Service', 'value': 'workspace'}
            ],
            propagateTags='SERVICE'
        )
        
        # Store in DynamoDB
        table.put_item(Item={
            'student_id': student_id,
            'service_name': service_name,
            'target_group_arn': tg_arn,
            'workspace_url': workspace_url,
            'status': 'provisioning',
            'created_at': int(time.time()),
            'last_activity': int(time.time())
        })
        
        return response(200, {'workspace_url': workspace_url, 'status': 'provisioning'})
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return response(500, {'error': str(e)})

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }

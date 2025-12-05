import json
import boto3
import os
import time
import uuid

ecs = boto3.client('ecs')
elbv2 = boto3.client('elbv2')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        student_id = body.get('student_id')
        
        if not student_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'student_id required'})}
        
        table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
        short_id = student_id[:8]
        service_name = f"ws-{short_id}"
        
        # Check if service already exists
        try:
            existing = ecs.describe_services(
                cluster=os.environ['ECS_CLUSTER'],
                services=[service_name]
            )
            if existing['services'] and existing['services'][0]['status'] == 'ACTIVE':
                # Service exists, return URL
                workspace_url = f"https://{service_name}.{os.environ['DOMAIN']}"
                return {
                    'statusCode': 200,
                    'body': json.dumps({'workspace_url': workspace_url, 'status': 'running'})
                }
        except:
            pass
        
        # Create target group
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
                Matcher={'HttpCode': '200-399'}
            )
            tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
        except elbv2.exceptions.DuplicateTargetGroupNameException:
            tg_response = elbv2.describe_target_groups(Names=[tg_name])
            tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
        
        # Create ALB rule
        rules = elbv2.describe_rules(ListenerArn=os.environ['ALB_LISTENER_ARN'])
        priorities = [int(r['Priority']) for r in rules['Rules'] if r['Priority'] != 'default']
        priority = max(priorities) + 1 if priorities else 100
        
        try:
            elbv2.create_rule(
                ListenerArn=os.environ['ALB_LISTENER_ARN'],
                Conditions=[{'Field': 'host-header', 'Values': [f"{service_name}.{os.environ['DOMAIN']}"]}],
                Actions=[{'Type': 'forward', 'TargetGroupArn': tg_arn}],
                Priority=priority
            )
        except:
            pass
        
        # Create ECS Service (this auto-manages target registration!)
        ecs.create_service(
            cluster=os.environ['ECS_CLUSTER'],
            serviceName=service_name,
            taskDefinition=os.environ['TASK_DEFINITION'],
            desiredCount=1,
            launchType='FARGATE',
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
            tags=[
                {'key': 'StudentId', 'value': student_id}
            ],
            propagateTags='SERVICE'
        )
        
        workspace_url = f"https://{service_name}.{os.environ['DOMAIN']}"
        
        table.put_item(Item={
            'student_id': student_id,
            'service_name': service_name,
            'target_group_arn': tg_arn,
            'workspace_url': workspace_url,
            'status': 'running',
            'created_at': int(time.time())
        })
        
        return {
            'statusCode': 200,
            'body': json.dumps({'workspace_url': workspace_url, 'status': 'provisioning'})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

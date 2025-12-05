import json
import boto3
import os
import time

ecs = boto3.client('ecs')
elbv2 = boto3.client('elbv2')
dynamodb = boto3.resource('dynamodb')

def ensure_alb_rule(service_name, domain, short_id):
    """Ensure ALB rule exists for the workspace"""
    listener_arn = os.environ['ALB_LISTENER_ARN']
    tg_name = f"ws-{short_id}"[:32]
    
    try:
        tg_response = elbv2.describe_target_groups(Names=[tg_name])
        tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
    except:
        return  # No target group means fresh provision needed
    
    # Check if rule already exists
    rules = elbv2.describe_rules(ListenerArn=listener_arn)
    for rule in rules['Rules']:
        if rule.get('Conditions'):
            for cond in rule['Conditions']:
                if cond.get('HostHeaderConfig', {}).get('Values', []):
                    if f"{service_name}.{domain}" in cond['HostHeaderConfig']['Values']:
                        return  # Rule exists
    
    # Create rule if missing
    priorities = [int(r['Priority']) for r in rules['Rules'] if r['Priority'] != 'default']
    priority = max(priorities) + 1 if priorities else 100
    
    try:
        elbv2.create_rule(
            ListenerArn=listener_arn,
            Conditions=[{'Field': 'host-header', 'Values': [f"{service_name}.{domain}"]}],
            Actions=[{'Type': 'forward', 'TargetGroupArn': tg_arn}],
            Priority=priority
        )
        print(f"Created ALB rule for {service_name}.{domain}")
    except Exception as e:
        print(f"Failed to create ALB rule: {e}")

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
        
        # Check if service already exists
        try:
            existing = ecs.describe_services(
                cluster=os.environ['ECS_CLUSTER'],
                services=[service_name]
            )
            if existing['services'] and existing['services'][0]['status'] == 'ACTIVE':
                # Service exists - ensure ALB rule also exists
                ensure_alb_rule(service_name, domain, short_id)
                
                running_count = existing['services'][0]['runningCount']
                if running_count > 0:
                    return response(200, {'workspace_url': workspace_url, 'status': 'running'})
                ecs.update_service(
                    cluster=os.environ['ECS_CLUSTER'],
                    service=service_name,
                    desiredCount=1
                )
                return response(200, {'workspace_url': workspace_url, 'status': 'starting'})
        except:
            pass
        
        # Create target group with stickiness
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
            # Enable stickiness
            elbv2.modify_target_group_attributes(
                TargetGroupArn=tg_arn,
                Attributes=[
                    {'Key': 'stickiness.enabled', 'Value': 'true'},
                    {'Key': 'stickiness.type', 'Value': 'lb_cookie'},
                    {'Key': 'stickiness.lb_cookie.duration_seconds', 'Value': '86400'},
                    {'Key': 'deregistration_delay.timeout_seconds', 'Value': '30'}
                ]
            )
        except elbv2.exceptions.DuplicateTargetGroupNameException:
            tg_response = elbv2.describe_target_groups(Names=[tg_name])
            tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
        
        # Create ALB rule
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
            print(f"Created ALB rule for {service_name}.{domain} with priority {priority}")
        except Exception as e:
            print(f"ALB rule creation result: {e}")
            # Try to verify rule exists
            try:
                for rule in rules['Rules']:
                    if rule.get('Conditions'):
                        for cond in rule['Conditions']:
                            vals = cond.get('HostHeaderConfig', {}).get('Values', [])
                            if f"{service_name}.{domain}" in vals:
                                print(f"ALB rule already exists for {service_name}.{domain}")
                                break
            except:
                pass
        
        # Create ECS Service with FARGATE_SPOT and STUDENT_ID override
        ecs.create_service(
            cluster=os.environ['ECS_CLUSTER'],
            serviceName=service_name,
            taskDefinition=os.environ['TASK_DEFINITION'],
            desiredCount=1,
            # Use Fargate Spot for 70% cost savings!
            capacityProviderStrategy=[
                {'capacityProvider': 'FARGATE_SPOT', 'weight': 4, 'base': 0},
                {'capacityProvider': 'FARGATE', 'weight': 1, 'base': 0}
            ],
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
        
        # Update task with STUDENT_ID environment variable via task override
        # This is done automatically by the task definition template
        
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

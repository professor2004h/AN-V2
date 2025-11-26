import boto3
import sys

def delete_vpc(vpc_id, region):
    ec2 = boto3.resource('ec2', region_name=region)
    ec2_client = boto3.client('ec2', region_name=region)
    vpc = ec2.Vpc(vpc_id)

    print(f"Starting cleanup for VPC {vpc_id}...")

    # Delete endpoints
    for ep in vpc_endpoints = ec2_client.describe_vpc_endpoints(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['VpcEndpoints']:
        ec2_client.delete_vpc_endpoints(VpcEndpointIds=[ep['VpcEndpointId']])
        print(f"Deleted VPC Endpoint: {ep['VpcEndpointId']}")

    # Delete peering connections
    for pcx in vpc.accepted_vpc_peering_connections.all():
        pcx.delete()
        print(f"Deleted Peering Connection: {pcx.id}")
    for pcx in vpc.requested_vpc_peering_connections.all():
        pcx.delete()
        print(f"Deleted Peering Connection: {pcx.id}")

    # Delete route tables (except main)
    for rt in vpc.route_tables.all():
        is_main = False
        for assoc in rt.associations:
            if assoc.main:
                is_main = True
                break
        if not is_main:
            for assoc in rt.associations:
                assoc.delete()
            rt.delete()
            print(f"Deleted Route Table: {rt.id}")

    # Delete internet gateways
    for igw in vpc.internet_gateways.all():
        vpc.detach_internet_gateway(InternetGatewayId=igw.id)
        igw.delete()
        print(f"Deleted Internet Gateway: {igw.id}")

    # Delete subnets
    for subnet in vpc.subnets.all():
        # Delete interfaces in subnet
        for interface in subnet.network_interfaces.all():
            interface.delete()
            print(f"Deleted Network Interface: {interface.id}")
        subnet.delete()
        print(f"Deleted Subnet: {subnet.id}")

    # Delete security groups (except default)
    for sg in vpc.security_groups.all():
        if sg.group_name != 'default':
            sg.delete()
            print(f"Deleted Security Group: {sg.id}")

    # Delete VPC
    ec2_client.delete_vpc(VpcId=vpc_id)
    print(f"Successfully deleted VPC: {vpc_id}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python cleanup_vpc.py <vpc_id> <region>")
        sys.exit(1)
    
    delete_vpc(sys.argv[1], sys.argv[2])

# AWS Infrastructure Summary

## Current Deployed Resources (as of 2025-11-23)

### VPC
- **VPC ID**: `vpc-03c570ff139fcf5ba`
- **Name**: apranova-lms-vpc
- **CIDR**: 10.0.0.0/16
- **State**: Available

### Subnets
1. **apranova-lms-public-1**
   - Subnet ID: `subnet-03d5e14dc2ce442e2`
   - CIDR: 10.0.1.0/24
   - VPC: vpc-03c570ff139fcf5ba

2. **apranova-lms-public-2**
   - Subnet ID: `subnet-07e124fa3ebff65e6`
   - CIDR: 10.0.2.0/24
   - VPC: vpc-03c570ff139fcf5ba

### Load Balancer
- **Name**: apranova-lms-alb
- **Type**: Application Load Balancer
- **State**: Active
- **Scheme**: Internet-facing
- **IP Address Type**: IPv4
- **VPC**: vpc-03c570ff139fcf5ba
- **Security Group**: sg-0b952809628d1bcdb
- **DNS Name**: apranova-lms-alb-2045677507.ap-southeast-2.elb.amazonaws.com

### Security Groups (VPC: vpc-03c570ff139fcf5ba)
1. **apranova-lms-alb-sg**
   - ID: `sg-0b952809628d1bcdb`
   - Description: Allow HTTP/HTTPS inbound

2. **apranova-lms-ecs-tasks-sg**
   - ID: `sg-04c367c01ceb37c1e`
   - Description: Allow inbound from ALB

3. **apranova-lms-redis-sg**
   - ID: `sg-06dd28fc7b78b6fa2`
   - Description: Allow Redis inbound from ECS

4. **apranova-lms-efs-sg**
   - ID: `sg-00d6a1a76b330411f`
   - Description: Allow inbound NFS from ECS

5. **default**
   - ID: `sg-0ccd6882a15a0f9b1`
   - Description: default VPC security group

## Issue Identified

The Terraform state is trying to manage resources in multiple VPCs. The errors indicate that:

1. **ALB Security Groups Error**: The ALB is trying to use security groups from a different VPC
2. **EFS Mount Target Error**: EFS mount targets are in a different VPC than the subnets Terraform is trying to create
3. **ElastiCache Subnet Group**: Cannot modify because it's in use

## Solution

The correct VPC to use is: **vpc-03c570ff139fcf5ba**

All import commands should target resources in this VPC.

## Additional Resources to Check

Still need to verify:
- ECS Cluster
- Auto Scaling Groups
- Launch Templates
- EFS File System and Mount Targets
- ElastiCache Cluster
- Route Tables
- Internet Gateway
- IAM Roles and Policies

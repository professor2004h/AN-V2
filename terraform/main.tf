# ============================================
# APRANOVA LMS - MAIN TERRAFORM CONFIGURATION
# ============================================

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Remote State Backend Configuration
terraform {
  backend "s3" {
    bucket         = "apranova-terraform-state-038839713355"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "apranova-terraform-locks"
  }
}

# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

# ============================================
# VPC MODULE
# ============================================
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = var.tags
}

# ============================================
# EFS MODULE (Student Workspace Storage)
# ============================================
module "efs" {
  source = "./modules/efs"

  project_name     = var.project_name
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  private_subnets  = module.vpc.private_subnet_ids
  ecs_security_group_id = module.ecs.ecs_security_group_id
  tags             = var.tags
}

# ============================================
# ECR MODULE (Container Registries)
# ============================================
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  tags         = var.tags
}

# ============================================
# ALB MODULE (Application Load Balancer)
# ============================================
module "alb" {
  source = "./modules/alb"

  project_name    = var.project_name
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnet_ids
  domain_name     = var.domain_name
  hosted_zone_id  = var.hosted_zone_id
  tags            = var.tags
}

# ============================================
# ECS MODULE (Container Orchestration)
# ============================================
module "ecs" {
  source = "./modules/ecs"

  project_name      = var.project_name
  environment       = var.environment
  aws_region        = var.aws_region
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id
  
  # Task configurations
  frontend_cpu      = var.frontend_cpu
  frontend_memory   = var.frontend_memory
  backend_cpu       = var.backend_cpu
  backend_memory    = var.backend_memory
  
  # ECR repositories
  frontend_ecr_url  = module.ecr.frontend_repository_url
  backend_ecr_url   = module.ecr.backend_repository_url
  codeserver_ecr_url = module.ecr.codeserver_repository_url
  
  # EFS configuration
  efs_file_system_id = module.efs.file_system_id
  
  # ALB target groups
  frontend_target_group_arn = module.alb.frontend_target_group_arn
  backend_target_group_arn  = module.alb.backend_target_group_arn
  
  # Supabase
  supabase_url = var.supabase_url

  # AWS Account
  aws_account_id = var.aws_account_id

  tags = var.tags
}

# ============================================
# LAMBDA MODULE (Workspace Management)
# ============================================
module "lambda" {
  source = "./modules/lambda"

  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids

  ecs_cluster_arn = module.ecs.cluster_arn
  ecs_cluster_name = module.ecs.cluster_name
  codeserver_task_definition_arn = module.ecs.codeserver_task_definition_arn
  codeserver_security_group_id = module.ecs.ecs_security_group_id

  # ALB configuration for workspace routing
  alb_arn          = module.alb.alb_arn
  alb_listener_arn = module.alb.http_listener_arn  # HTTPS listener managed manually in AWS

  workspace_inactivity_timeout = var.workspace_inactivity_timeout

  tags = var.tags
}

# ============================================
# CLOUDWATCH MODULE (Monitoring)
# ============================================
module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name              = var.project_name
  environment               = var.environment
  aws_region                = var.aws_region
  ecs_cluster_name          = module.ecs.cluster_name
  alb_arn_suffix            = module.alb.alb_arn_suffix
  efs_file_system_id        = module.efs.file_system_id
  provisioner_function_name = module.lambda.provisioner_function_name
  terminator_function_name  = module.lambda.terminator_function_name

  tags = var.tags
}

# ============================================
# REDIS MODULE (Session Management)
# ============================================
module "redis" {
  source = "./modules/redis"

  project_name             = var.project_name
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  private_subnets          = module.vpc.private_subnet_ids
  ecs_security_group_id    = module.ecs.ecs_security_group_id
  lambda_security_group_id = module.lambda.lambda_security_group_id

  tags = var.tags
}



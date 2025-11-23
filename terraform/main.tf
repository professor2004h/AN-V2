terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "apranova-lms-terraform-state"
    key            = "terraform.tfstate"
    region         = "ap-southeast-2"
    encrypt        = true
    dynamodb_table = "apranova-lms-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

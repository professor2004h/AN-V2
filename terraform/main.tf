terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "apranova-lms-tf-state-183037996720"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "apranova-lms-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

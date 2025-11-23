# Apranova LMS - AWS Production Deployment Guide

This guide details the steps to deploy the Apranova LMS to AWS using Terraform and GitHub Actions.

## 🏗 Architecture Overview

To support the "Docker Workspace" feature where students get their own isolated containers, we use a **Hybrid ECS Architecture**:

*   **Frontend**: Deployed on **AWS Fargate** (Serverless) for scalability and ease of management.
*   **Backend**: Deployed on **ECS EC2 Launch Type**.
    *   **Why EC2?** The backend needs to spawn new Docker containers for student workspaces. This requires access to the Docker socket (`/var/run/docker.sock`). Fargate does not support this directly.
    *   **Cost Optimization**: We use `t3.medium` instances which are cost-effective and sufficient for initial workloads.
*   **Database**: Supabase (External).
*   **Storage**: AWS EFS for persistent workspace data.
*   **Networking**: Public subnets with strict Security Groups (cheaper than NAT Gateways).

## 📋 Prerequisites

1.  **AWS CLI** installed and configured (`aws configure`).
2.  **Terraform** installed.
3.  **Docker** installed.
4.  **GitHub Repository** with the code.

## 🚀 Initial Bootstrap (Run Locally)

Since the GitHub Action needs the ECR repositories to exist before pushing images, you must run Terraform locally once to create the infrastructure.

1.  **Navigate to Terraform directory:**
    ```bash
    cd terraform
    ```

2.  **Initialize Terraform:**
    ```bash
    terraform init
    ```

3.  **Create a `terraform.tfvars` file** (DO NOT COMMIT THIS):
    ```hcl
    supabase_url              = "your_supabase_url"
    supabase_anon_key         = "your_anon_key"
    supabase_service_role_key = "your_service_role_key"
    db_password               = "your_db_password"
    stripe_secret_key         = "your_stripe_secret"
    stripe_publishable_key    = "your_stripe_public"
    stripe_webhook_secret     = "your_stripe_webhook"
    jwt_secret                = "your_jwt_secret"
    code_server_password      = "apranova123"
    ```

4.  **Apply Terraform:**
    ```bash
    terraform apply
    ```
    *Type `yes` to confirm.*

    This will create:
    *   VPC & Networking
    *   ECR Repositories
    *   ECS Cluster & Services
    *   Load Balancer (ALB)
    *   EFS File System

## 🔐 GitHub Secrets Setup

Go to your GitHub Repository -> Settings -> Secrets and Variables -> Actions -> New Repository Secret. Add the following:

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM User Access Key |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret Key |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `DB_PASSWORD` | Database Password |
| `STRIPE_SECRET_KEY` | Stripe Secret Key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret |
| `JWT_SECRET` | JWT Secret for Auth |
| `CODE_SERVER_PASSWORD` | Password for Student Workspaces |

## 🔄 CI/CD Pipeline

The `.github/workflows/deploy.yml` workflow handles:
1.  Building Docker images for Frontend and Backend.
2.  Pushing images to ECR.
3.  Applying Terraform changes (if any).
4.  Updating ECS Services to pull new images.

## 💰 Cost Optimization

*   **Fargate Spot**: The ECS Cluster is configured to use Fargate Spot for the frontend where possible.
*   **Public Subnets**: We avoided NAT Gateways (~$30/mo) by placing tasks in public subnets. Security is maintained via Security Groups (only ALB ingress allowed).
*   **Instance Type**: Backend uses `t3.medium`. You can downgrade to `t3.small` in `terraform/variables.tf` if load is low.
*   **EFS Lifecycle**: configured to move data to Infrequent Access (IA) after 30 days.

## 🔍 Verification

1.  **Get ALB URL**:
    ```bash
    terraform output alb_dns_name
    ```
2.  **Visit URL**: Open the ALB URL in your browser.
3.  **Test Workspace**: Login as a student and provision a workspace. It should launch a container on the backend EC2 instance.

## ⚠️ Important Notes

*   **State Management**: Terraform state is currently local (`terraform.tfstate`). For team usage, configure an S3 backend in `main.tf`.
*   **Security**: Ensure your AWS IAM User for GitHub Actions has least-privilege access (ECR, ECS, IAM, VPC access).


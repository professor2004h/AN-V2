# ============================================
# ALB WORKSPACE ROUTING CONFIGURATION
# ============================================

# Data source for existing ALB
data "aws_lb" "main" {
  name = "${var.project_name}-alb"
}

# Data source for existing listener
data "aws_lb_listener" "http" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 80
}

# Target group for code-server workspaces
resource "aws_lb_target_group" "code_server" {
  name        = "${var.project_name}-code-server-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/healthz"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-code-server-tg"
  }
}

# Listener rule for workspace routing
resource "aws_lb_listener_rule" "workspace" {
  listener_arn = data.aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.code_server.arn
  }

  condition {
    path_pattern {
      values = ["/workspace/*"]
    }
  }

  tags = {
    Name = "${var.project_name}-workspace-rule"
  }
}

# Output the target group ARN for backend use
output "code_server_target_group_arn" {
  value       = aws_lb_target_group.code_server.arn
  description = "ARN of the code-server target group"
}

# ============================================
# ALB TARGET GROUPS
# Optimized for WebSocket and stability
# ============================================

# Frontend Target Group
resource "aws_lb_target_group" "frontend" {
  name        = "apranova-prod-fe-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  # CRITICAL: Enable stickiness for WebSocket connections
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # 1 day
    enabled         = true
  }

  # Deregistration delay for graceful shutdown
  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-frontend-tg"
  })
}

# Backend Target Group
resource "aws_lb_target_group" "backend" {
  name        = "apranova-prod-be-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-backend-tg"
  })
}

# Code-Server Workspace Target Group (Default for dynamic workspaces)
resource "aws_lb_target_group" "codeserver" {
  name        = "apranova-prod-cs-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200,302"  # Code-server may redirect
    path                = "/healthz"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  # CRITICAL: Long stickiness for workspace sessions
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # 1 day - student stays on same workspace
    enabled         = true
  }

  # Longer deregistration for code saving
  deregistration_delay = 60

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-codeserver-tg"
  })
}


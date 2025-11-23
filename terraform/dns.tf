# --- Route53 & ACM (Uncomment if you have the domain in Route53) ---

# variable "domain_name" {
#   default = "apranova.com"
# }

# data "aws_route53_zone" "main" {
#   name         = var.domain_name
#   private_zone = false
# }

# resource "aws_acm_certificate" "main" {
#   domain_name       = var.domain_name
#   validation_method = "DNS"

#   tags = {
#     Name = "${var.app_name}-cert"
#   }
# }

# resource "aws_route53_record" "cert_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => dvo
#   }

#   allow_overwrite = true
#   name            = each.value.resource_record_name
#   records         = [each.value.resource_record_value]
#   ttl             = 60
#   type            = each.value.resource_record_type
#   zone_id         = data.aws_route53_zone.main.zone_id
# }

# resource "aws_acm_certificate_validation" "main" {
#   certificate_arn         = aws_acm_certificate.main.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
# }

# resource "aws_route53_record" "www" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "www.${var.domain_name}"
#   type    = "A"

#   alias {
#     name                   = aws_lb.main.dns_name
#     zone_id                = aws_lb.main.zone_id
#     evaluate_target_health = true
#   }
# }

# resource "aws_route53_record" "root" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = var.domain_name
#   type    = "A"

#   alias {
#     name                   = aws_lb.main.dns_name
#     zone_id                = aws_lb.main.zone_id
#     evaluate_target_health = true
#   }
# }

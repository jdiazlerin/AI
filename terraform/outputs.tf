# Infrastructure Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.website.hosted_zone_id
}

# Website URLs
output "website_url" {
  description = "Main website URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "cloudfront_url" {
  description = "Direct CloudFront URL"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

# Removed Cognito outputs - authentication resources removed

# Removed Lambda@Edge outputs - authentication function removed

# Security Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL (if enabled)"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL (if enabled)"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

# SSL Certificate Outputs
output "acm_certificate_arn" {
  description = "ARN of the ACM certificate (if custom domain)"
  value       = var.domain_name != "" ? aws_acm_certificate.main[0].arn : null
}

output "acm_certificate_status" {
  description = "Validation status of the ACM certificate"
  value       = var.domain_name != "" ? aws_acm_certificate.main[0].status : null
}

# DNS Outputs
output "route53_zone_id" {
  description = "Route 53 hosted zone ID (if using custom domain)"
  value       = var.domain_name != "" ? data.aws_route53_zone.main[0].zone_id : null
}

output "route53_name_servers" {
  description = "Route 53 name servers (if using custom domain)"
  value       = var.domain_name != "" ? data.aws_route53_zone.main[0].name_servers : null
}

# CI/CD Integration Outputs
output "s3_sync_command" {
  description = "AWS CLI command to sync files to S3 bucket"
  value       = "aws s3 sync ./dist/ s3://${aws_s3_bucket.website.bucket}/ --delete --exact-timestamps"
}

output "cloudfront_invalidation_command" {
  description = "AWS CLI command to invalidate CloudFront cache"
  value       = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.website.id} --paths '/*'"
}

output "deployment_commands" {
  description = "Complete deployment command sequence"
  value = {
    build   = "npm run build"
    sync    = "aws s3 sync ./dist/ s3://${aws_s3_bucket.website.bucket}/ --delete --exact-timestamps"
    invalidate = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.website.id} --paths '/*'"
  }
}

# Environment Configuration for Frontend
output "frontend_config" {
  description = "Configuration values for frontend application"
  value = {
    AWS_REGION              = var.aws_region
    API_BASE_URL           = var.domain_name != "" ? "https://${var.domain_name}/api" : "https://${aws_cloudfront_distribution.website.domain_name}/api"
    WEBSITE_URL            = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.website.domain_name}"
    AUTHENTICATION_ENABLED = false
  }
  sensitive = false
}

# Resource Summary
output "resource_summary" {
  description = "Summary of created resources"
  value = {
    s3_bucket       = aws_s3_bucket.website.bucket
    cloudfront_id   = aws_cloudfront_distribution.website.id
    waf_enabled     = var.enable_waf
    custom_domain   = var.domain_name != "" ? var.domain_name : "CloudFront Default"
    environment     = var.environment
    authentication  = "disabled"
  }
}

# File deployment information
output "deployed_files" {
  description = "Information about deployed game files"
  value = {
    index_html = {
      key          = aws_s3_object.index_html.key
      etag         = aws_s3_object.index_html.etag
      content_type = aws_s3_object.index_html.content_type
    }
    styles_css = {
      key          = aws_s3_object.styles_css.key  
      etag         = aws_s3_object.styles_css.etag
      content_type = aws_s3_object.styles_css.content_type
    }
    simon_js = {
      key          = aws_s3_object.simon_js.key
      etag         = aws_s3_object.simon_js.etag
      content_type = aws_s3_object.simon_js.content_type
    }
  }
}

output "deployment_info" {
  description = "Deployment completion message with instructions"
  value = <<-EOT
  
  🎮 Simon Memory Game Successfully Deployed! 🎮
  
  🌐 Game URL: ${var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.website.domain_name}"}
  
  📁 Files Deployed:
     ✅ index.html
     ✅ styles.css
     ✅ simon.js
     ✅ favicon.ico (SVG icon)
     ✅ manifest.json (PWA support)
     ✅ robots.txt (SEO)
  
  🚀 Features Available:
     • Advanced Simon Memory Game with 6 sound packs
     • Multiple visual themes (Classic, Cyberpunk, Synthwave, etc.)
     • Accessibility features (colorblind support, visual indicators)
     • Audio customization (volume, tempo, sound packs)
     • Weather integration with geolocation
     • Progressive Web App (PWA) capabilities
     • Responsive design for all devices
  
  🔓 Access: Open to all users (no authentication required)
  🔐 Security: Protected by AWS WAF and CloudFront
  📊 Analytics: CloudWatch monitoring enabled
  
  Note: CloudFront cache propagation may take 5-10 minutes.
  EOT
}

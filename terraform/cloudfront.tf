# Security headers response policy
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "${var.project_name}-${var.environment}-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    
    content_type_options {
      override = true
    }
    
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    
    content_security_policy {
      content_security_policy = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; img-src 'self' data: https:; font-src 'self' data: https:;"
      override                = true
    }
  }

  cors_config {
    access_control_allow_credentials = false
    
    access_control_allow_headers {
      items = ["*"]
    }
    
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
    }
    
    access_control_allow_origins {
      items = var.cors_allowed_origins
    }
    
    origin_override = true
  }

  custom_headers_config {
    items {
      header   = "X-Powered-By"
      value    = "AWS"
      override = true
    }
    
    items {
      header   = "X-Application"
      value    = "Simon Memory Game"
      override = true
    }
  }
}

# No longer needed - removed dynamic cache policy for authentication

# Cache policy for static assets
resource "aws_cloudfront_cache_policy" "static_assets" {
  name        = "${var.project_name}-${var.environment}-static-cache"
  comment     = "Cache policy for static assets"
  default_ttl = 86400
  max_ttl     = 31536000
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
    
    query_strings_config {
      query_string_behavior = "none"
    }
    
    headers_config {
      header_behavior = "none"
    }
    
    cookies_config {
      cookie_behavior = "none"
    }
  }
}

# Origin request policy for API calls
resource "aws_cloudfront_origin_request_policy" "api_requests" {
  name    = "${var.project_name}-${var.environment}-api-requests"
  comment = "Origin request policy for API calls"
  
  cookies_config {
    cookie_behavior = "all"
  }
  
  headers_config {
    header_behavior = "allViewer"
  }
  
  query_strings_config {
    query_string_behavior = "all"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
    origin_id                = "S3-${aws_s3_bucket.website.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
  price_class         = var.price_class
  
  aliases = var.domain_name != "" ? [var.domain_name] : []

  # Default cache behavior for static website
  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD", "OPTIONS"]
    target_origin_id           = "S3-${aws_s3_bucket.website.bucket}"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern               = "/static/*"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD", "OPTIONS"]
    target_origin_id           = "S3-${aws_s3_bucket.website.bucket}"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behavior for assets with file extensions
  ordered_cache_behavior {
    path_pattern               = "*.css"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-${aws_s3_bucket.website.bucket}"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
  }

  ordered_cache_behavior {
    path_pattern               = "*.js"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-${aws_s3_bucket.website.bucket}"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
  }

  ordered_cache_behavior {
    path_pattern               = "*.png"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-${aws_s3_bucket.website.bucket}"
    compress                   = false
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
  }

  ordered_cache_behavior {
    path_pattern               = "*.jpg"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-${aws_s3_bucket.website.bucket}"
    compress                   = false
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
  }

  ordered_cache_behavior {
    path_pattern               = "*.ico"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-${aws_s3_bucket.website.bucket}"
    compress                   = false
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
  }

  # Cache behavior for API calls (no caching)
  ordered_cache_behavior {
    path_pattern                = "/api/*"
    allowed_methods             = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods              = ["GET", "HEAD"]
    target_origin_id            = "S3-${aws_s3_bucket.website.bucket}"
    compress                    = true
    viewer_protocol_policy      = "redirect-to-https"
    cache_policy_id             = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # Managed-CachingDisabled
    origin_request_policy_id    = aws_cloudfront_origin_request_policy.api_requests.id
    response_headers_policy_id  = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate configuration
  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == ""
    acm_certificate_arn           = var.domain_name != "" ? aws_acm_certificate_validation.main[0].certificate_arn : null
    ssl_support_method            = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version      = var.domain_name != "" ? "TLSv1.2_2021" : null
  }

  # Custom error responses for SPA routing
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # CloudFront access logging
  dynamic "logging_config" {
    for_each = var.enable_logging ? [1] : []
    content {
      include_cookies = false
      bucket          = aws_s3_bucket.logs[0].bucket_domain_name
      prefix          = "cloudfront-logs/"
    }
  }

  tags = local.common_tags

  # Remove Lambda@Edge dependency - only keep S3 logging dependencies
  depends_on = [
    aws_s3_bucket_acl.logs
  ]
}

# CloudFront cache invalidation when files change
resource "null_resource" "cloudfront_invalidation" {
  # Trigger invalidation when any of the main files change
  triggers = {
    index_html = aws_s3_object.index_html.etag
    styles_css = aws_s3_object.styles_css.etag
    simon_js   = aws_s3_object.simon_js.etag
    manifest   = aws_s3_object.manifest.content
    favicon    = aws_s3_object.favicon.content
  }

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.website.id} --paths '/*'"
  }

  depends_on = [
    aws_cloudfront_distribution.website,
    aws_s3_object.index_html,
    aws_s3_object.styles_css,
    aws_s3_object.simon_js
  ]
}

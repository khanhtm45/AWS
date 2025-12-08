output "s3_bucket_url" {
  value = aws_s3_bucket.frontend.website_endpoint
}
output "cloudfront_url" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

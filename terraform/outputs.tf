output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
  description = "The ID of the Cognito User Pool"
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.client.id
  description = "The ID of the Cognito User Pool Client"
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.main.id
  description = "The ID of the Cognito Identity Pool"
}

output "graphql_api_url" {
  value = aws_appsync_graphql_api.main.uris["GRAPHQL"]
  description = "The URL of the GraphQL API"
}

output "s3_bucket_name" {
  value = aws_s3_bucket.venue_images.bucket
  description = "The name of the S3 bucket for venue images"
}

output "aws_config_js" {
  value = <<EOT
// Copy this to your src/aws-config.js file
const awsConfig = {
  Auth: {
    region: "${var.aws_region}",
    userPoolId: "${aws_cognito_user_pool.main.id}",
    userPoolWebClientId: "${aws_cognito_user_pool_client.client.id}",
    identityPoolId: "${aws_cognito_identity_pool.main.id}",
  },
  Storage: {
    AWSS3: {
      bucket: "${aws_s3_bucket.venue_images.bucket}",
      region: "${var.aws_region}",
    }
  },
  API: {
    graphql_endpoint: "${aws_appsync_graphql_api.main.uris["GRAPHQL"]}",
    graphql_headers: async () => ({
      Authorization: (await Auth.currentSession()).getIdToken().getJwtToken()
    })
  }
};

export default awsConfig;
EOT
  description = "AWS configuration for your React app"
}

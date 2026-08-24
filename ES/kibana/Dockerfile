FROM docker.elastic.co/kibana/kibana:8.19.10

# No configuration is baked into the image. Every connection setting is injected
# at runtime as an environment variable (docker run -e / compose environment / k8s env):
#   ELASTICSEARCH_HOSTS                 - the Elasticsearch to connect to (required)
#   ELASTICSEARCH_USERNAME             - basic-auth user   (omit for a security-disabled cluster)
#   ELASTICSEARCH_PASSWORD             - basic-auth password (omit for a security-disabled cluster)
#   ELASTICSEARCH_SSL_VERIFICATIONMODE - "none" for self-signed https, "full" to verify
# The base image already binds server.host to 0.0.0.0 and serves on 5601.

EXPOSE 5601

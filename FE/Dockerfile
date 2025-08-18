FROM nginx

# Accept environment selection as a build argument (production|stage|local)
ARG environment=local
ENV environment=${environment}

COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY prepare-config.sh /usr/local/bin/prepare-config.sh
RUN chmod +x /usr/local/bin/prepare-config.sh

# Prepare environment.json based on selected environment
RUN ["/bin/sh", "-c", "/usr/local/bin/prepare-config.sh"]

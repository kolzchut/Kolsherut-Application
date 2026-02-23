FROM nginx

# Set locale to UTF-8 - For SSGenerated files that may contain non-ASCII characters
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Accept environment selection as a build argument (production|stage|local|development)
ARG environment=local
ENV environment=${environment}

COPY dist /usr/share/nginx/html
COPY nginx-${environment}.conf /etc/nginx/nginx.conf
COPY redirects.map /etc/nginx/redirects.map

COPY dist/configs /usr/share/nginx/html/configs
COPY dist/configs/${environment}.json /usr/share/nginx/html/configs/environment.json

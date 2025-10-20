# Use OpenResty instead of plain Nginx to support Lua
FROM openresty/openresty:alpine

# Accept environment selection as a build argument (production|stage|local)
ARG environment=local
ENV environment=${environment}

COPY dist /usr/share/nginx/html
COPY nginx-${environment}.conf /etc/nginx/nginx.conf

# Overwrite environment.json with the selected environment file from the built dist
COPY dist/configs/${environment}.json /usr/share/nginx/html/configs/environment.json

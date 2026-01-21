FROM nginx:alpine
ARG VERSION=unknown

COPY index.html /usr/share/nginx/html/index.html

RUN sed -i "s/VERSION_PLACEHOLDER/$VERSION/g" /usr/share/nginx/html/index.html
EXPOSE 80


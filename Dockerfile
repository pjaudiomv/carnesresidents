FROM busybox:1.36

RUN adduser -D website
WORKDIR /home/website
COPY . .
RUN LOCAL_KEY=$(grep 'LOCAL_GOOGLE_API_KEY' vars.env | cut -d'=' -f2 | tr -d '"') && \
    sed -i "s/API_KEY: \".*\",/API_KEY: \"$LOCAL_KEY\",/" assets/js/food-trucks.js
USER website
CMD ["busybox", "httpd", "-f", "-v", "-p", "8000"]

FROM busybox:1.36

RUN adduser -D static
USER static
WORKDIR /home/static
COPY . .

CMD ["busybox", "httpd", "-f", "-v", "-p", "8000"]

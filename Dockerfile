FROM node:20-alpine3.16

WORKDIR /app

ENV NDOE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN apk add chromium && rm -rf /var/cache/apk/* /tmp/*

ADD package.json package-lock.json .
RUN npm ci

COPY . .

ENTRYPOINT ["node", "/app"]
CMD []

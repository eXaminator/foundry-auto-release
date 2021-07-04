FROM buildkite/puppeteer:latest
WORKDIR /app
ENV NDOE_ENV=production

COPY package.json .
COPY package-lock.json .
RUN  npm ci

COPY . .

# 第一阶段：构建
FROM docker.m.daocloud.io/node:22-alpine AS builder

WORKDIR /app

# 先复制 package 文件，利用缓存
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# 第二阶段：运行
FROM docker.m.daocloud.io/node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 只复制运行所需的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

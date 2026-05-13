# 第一阶段：构建
FROM docker.m.daocloud.io/node:22-alpine AS builder

WORKDIR /app

# 声明构建参数（NEXT_PUBLIC_ 开头的变量需要在构建时注入）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_WECHAT_APP_ID
ARG NEXT_PUBLIC_BASE_URL

# 设置为环境变量供构建使用
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_WECHAT_APP_ID=$NEXT_PUBLIC_WECHAT_APP_ID
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 第二阶段：运行
FROM docker.m.daocloud.io/node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

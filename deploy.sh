#!/bin/bash
set -e

echo "=== 开始部署 $(date) ==="

# 进入项目目录
cd /var/www/aibanxing

# 拉取最新代码
echo ">>> 拉取最新代码..."
git pull origin main

# 构建新镜像
echo ">>> 构建 Docker 镜像..."
source /var/www/aibanxing/.env.local
podman build -t aibanxing \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_WECHAT_APP_ID="$NEXT_PUBLIC_WECHAT_APP_ID" \
  --build-arg NEXT_PUBLIC_BASE_URL="$NEXT_PUBLIC_BASE_URL" \
  /var/www/aibanxing

# 停止并删除旧容器
echo ">>> 停止旧容器..."
podman stop aibanxing || true
podman rm aibanxing || true

# 启动新容器
echo ">>> 启动新容器..."
podman run -d \
  --name aibanxing \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /var/www/aibanxing/.env.local \
  aibanxing

# 等待启动
echo ">>> 等待服务启动..."
sleep 5

# 验证
if curl -s http://10.88.0.11:3000 > /dev/null; then
  echo "=== 部署成功 $(date) ==="
else
  echo "=== 部署失败，请检查日志 ==="
  podman logs aibanxing --tail 20
  exit 1
fi

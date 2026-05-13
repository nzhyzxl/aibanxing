#!/bin/bash
set -e

echo "=== 开始部署 $(date) ==="

# ── 配置 ──
PROJECT_DIR="/var/www/aibanxing"
CONTAINER_NAME="aibanxing"
IMAGE_NAME="aibanxing"
PORT=3000
HEALTH_URL="http://10.88.0.11:${PORT}"
KEEP_IMAGES=3             # 保留最近几个版本的镜像

cd "$PROJECT_DIR"

# ── 1. 磁盘检查 ──
AVAILABLE_GB=$(df -BG "$PROJECT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_GB" -lt 5 ]; then
  echo "!!! 磁盘空间不足 5GB，开始紧急清理..."
  podman image prune -af
  podman system prune -f
fi

# ── 2. 拉取代码 ──
echo ">>> 拉取最新代码..."
git pull origin main

# ── 3. 构建新镜像（带日期版本号） ──
echo ">>> 构建 Docker 镜像..."
VERSION="$(date +%Y%m%d-%H%M%S)"

# 安全加载环境变量（不 source，避免污染 shell）
export $(grep -v '^#' /var/www/aibanxing/.env.local | grep -v '^$' | xargs)

podman build -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_WECHAT_APP_ID="$NEXT_PUBLIC_WECHAT_APP_ID" \
  --build-arg NEXT_PUBLIC_BASE_URL="$NEXT_PUBLIC_BASE_URL" \
  "$PROJECT_DIR"

# ── 4. 健康检查函数 ──
health_check() {
  local max_attempts=12
  local attempt=1
  while [ $attempt -le $max_attempts ]; do
    if curl -s "$HEALTH_URL" > /dev/null 2>&1; then
      return 0
    fi
    echo "    等待服务就绪... (${attempt}/${max_attempts})"
    sleep 5
    attempt=$((attempt + 1))
  done
  return 1
}

# ── 5. 滚动更新 ──
# 先启动新容器（不同端口），验证通过后再切换
NEW_CONTAINER="${CONTAINER_NAME}_${VERSION}"
TEMP_PORT=$((PORT + 1))

echo ">>> 启动新容器验证..."
podman run -d \
  --name "$NEW_CONTAINER" \
  --restart unless-stopped \
  -p "${TEMP_PORT}:${PORT}" \
  --env-file /var/www/aibanxing/.env.local \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "${IMAGE_NAME}:latest"

# 等待新容器健康检查
echo ">>> 验证新容器..."
if ! curl -s "http://10.88.0.11:${TEMP_PORT}" > /dev/null 2>&1; then
  echo "    新容器未就绪，等待健康检查..."
  sleep 10
fi

# ── 6. 切换流量 ──
echo ">>> 停止旧容器..."
podman stop "$CONTAINER_NAME" 2>/dev/null || true
sleep 2

echo ">>> 重建主容器..."
podman rm "$CONTAINER_NAME" 2>/dev/null || true

podman run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${PORT}:${PORT}" \
  --env-file /var/www/aibanxing/.env.local \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  "${IMAGE_NAME}:latest"

# ── 7. 清理临时容器 ──
podman stop "$NEW_CONTAINER" 2>/dev/null || true
podman rm "$NEW_CONTAINER" 2>/dev/null || true

# ── 8. 最终验证 ──
echo ">>> 最终验证..."
if health_check; then
  echo "=== 部署成功 $(date) ==="
else
  echo "!!! 新容器未通过健康检查，回滚到上一版本..."
  # 回滚：用上一个版本镜像启动
  ROLLBACK_IMAGE=$(podman images --format '{{.Tag}}' "$IMAGE_NAME" | grep -v latest | sort -r | head -2 | tail -1)
  if [ -n "$ROLLBACK_IMAGE" ]; then
    podman stop "$CONTAINER_NAME" 2>/dev/null || true
    podman rm "$CONTAINER_NAME" 2>/dev/null || true
    podman run -d \
      --name "$CONTAINER_NAME" \
      --restart unless-stopped \
      -p "${PORT}:${PORT}" \
      --env-file /var/www/aibanxing/.env.local \
      --log-opt max-size=10m \
      --log-opt max-file=3 \
      "${IMAGE_NAME}:${ROLLBACK_IMAGE}"
    echo "=== 已回滚到版本 ${ROLLBACK_IMAGE} ==="
  fi
  podman logs "$CONTAINER_NAME" --tail 30
  exit 1
fi

# ── 9. 清理旧镜像（保留最近 N 个） ──
echo ">>> 清理旧镜像..."
# 列出所有版本号镜像（排除 latest），按时间排序，删除旧的
OLD_IMAGES=$(podman images --format '{{.Tag}}' "$IMAGE_NAME" \
  | grep -E '^[0-9]{8}-[0-9]{6}$' \
  | sort -r \
  | tail -n +$((KEEP_IMAGES + 1)))

for old_tag in $OLD_IMAGES; do
  echo "    删除旧镜像: ${IMAGE_NAME}:${old_tag}"
  podman rmi "${IMAGE_NAME}:${old_tag}" 2>/dev/null || true
done

# 清理悬空镜像和构建缓存
podman image prune -f
podman builder prune -f --filter until=24h

echo "=== 磁盘使用情况 ==="
df -h "$PROJECT_DIR"
echo "=== 部署完成 $(date) ==="

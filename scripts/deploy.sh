#!/usr/bin/env bash
# 一键生产部署:安装依赖 -> 构建前端 -> 启动后端(PM2 优先,回退 nohup)
# 用法: bash scripts/deploy.sh   或   npm run deploy
# 可选环境变量: PORT=3001  NPM_CACHE=/tmp/...
set -euo pipefail
cd "$(dirname "$0")/.."

CACHE="${NPM_CACHE:-/tmp/npm-cache-flight}"
PORT="${PORT:-3001}"

echo "[deploy] 1/3 安装依赖..."
[ -d node_modules ] || npm install --cache "$CACHE"
[ -d server/node_modules ] || (cd server && npm install --cache "$CACHE")

echo "[deploy] 2/3 构建前端(Vite -> dist/)..."
npm run build

echo "[deploy] 3/3 启动后端(端口 $PORT)..."
mkdir -p server/logs
# 停掉旧实例(优先按 pid 文件,避免误杀)
[ -f server/logs/server.pid ] && kill "$(cat server/logs/server.pid)" 2>/dev/null || true

if command -v pm2 >/dev/null 2>&1; then
  pm2 delete flight-api 2>/dev/null || true
  pm2 start ecosystem.config.cjs --env production
  pm2 save
  echo "[deploy] 后端已由 PM2 托管 -> 查看日志: pm2 logs flight-api"
else
  PORT="$PORT" nohup node server/index.js > server/logs/server.out 2>&1 &
  echo $! > server/logs/server.pid
  echo "[deploy] 后端已 nohup 启动,PID=$(cat server/logs/server.pid)"
  echo "[deploy] 建议安装 PM2 做进程守护: npm i -g pm2"
fi

cat <<EOF

[deploy] 完成!
  前端静态文件: dist/              (交给 nginx 托管)
  后端 API:      http://127.0.0.1:$PORT
  nginx 示例:    deploy/nginx.conf.example
  访问日志:      server/logs/access.log

下一步(配 nginx):
  sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/flight.conf
  # 改 server_name 和 root 路径后:
  sudo nginx -t && sudo systemctl reload nginx
EOF

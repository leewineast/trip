#!/usr/bin/env bash
# 一键本地开发:启动后端(:3001)+ 前端(:5173),Ctrl+C 一起退出
# 用法: bash scripts/dev.sh   或   npm run dev:all
set -euo pipefail
cd "$(dirname "$0")/.."

CACHE="${NPM_CACHE:-/tmp/npm-cache-flight}"

echo "[dev] 检查依赖..."
[ -d node_modules ] || npm install --cache "$CACHE"
[ -d server/node_modules ] || (cd server && npm install --cache "$CACHE")

echo "[dev] 启动后端(:3001)与前端(:5173)..."
cleanup() { kill 0 2>/dev/null || true; }
trap cleanup EXIT INT TERM

(cd server && PORT=3001 npm start) &
npm run dev &
wait

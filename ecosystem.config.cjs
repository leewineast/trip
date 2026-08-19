// PM2 进程配置 —— deploy.sh 检测到 pm2 时自动使用
// 启动: pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'flight-api',
      script: 'server/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: '256M',
      env: { NODE_ENV: 'production', PORT: 3001 },
      out_file: 'server/logs/pm2-out.log',
      error_file: 'server/logs/pm2-err.log',
      time: true,
    },
  ],
}

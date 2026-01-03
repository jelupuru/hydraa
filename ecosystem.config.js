module.exports = {
  apps: [{
    name: 'hydraa',
    script: 'npm',
    args: 'start',
    cwd: '/home/azureuser/hydraa',
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    error_file: '/home/azureuser/hydraa/logs/app-error.log',
    out_file: '/home/azureuser/hydraa/logs/app-out.log',
    log_file: '/home/azureuser/hydraa/logs/app.log',
    time: true,
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};</content>
<parameter name="filePath">c:\Users\Jayakumar\Documents\hydraa\hydraa\hydranew\hydraa\ecosystem.config.js
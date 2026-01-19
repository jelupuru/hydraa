module.exports = {
  apps: [
    {
      name: "hydraa",

      // Use npm with explicit interpreter
      script: "npm",
      args: "run start",

      // App root
      cwd: "/home/hydraauser/hydraa",

      // Single source of truth for env
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },

      // Process settings
      instances: 1,
      exec_mode: "fork",

      // Stability & limits
      autorestart: true,
      max_restarts: 5,
      min_uptime: "10s",
      max_memory_restart: "1G",

      // Logging
      error_file: "/home/hydraauser/hydraa/logs/app-error.log",
      out_file: "/home/hydraauser/hydraa/logs/app-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Other
      watch: false,
      time: true
    }
  ]
};

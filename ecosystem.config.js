module.exports = {
  apps: [
    {
      name: "hydraa",

      // Use npm with explicit interpreter
      script: "npm",
      args: "run start",

      // App root
      cwd: "/home/hydraauser/hydraa",

      // Environment variables from .env.production
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        SECRET: "8deadf2493fa2ec5467cd1e756ae7fcb31b0e9ed301aaa4952374d27d9b10f45",
        NEXTAUTH_URL: "https://hydraa.eastasia.cloudapp.azure.com",
        NEXT_PUBLIC_SITE_URL: "https://hydraa.eastasia.cloudapp.azure.com",
        SITE_URL: "https://hydraa.eastasia.cloudapp.azure.com",
        SITE_NAME: "Hydraa",
        AUTHOR_NAME: "Jayakumar",
        DATABASE_URL: "postgresql://hydraa_user:hydraa_password@127.0.0.1:5432/hydraa"
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

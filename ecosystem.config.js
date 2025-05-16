module.exports = {
  apps: [{
    name: "sfmanagers",
    script: "server.js",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      MYSQL_DATABASE_URL: "mysql://hdadmin_sfm:25Y7Pwsd6UKEh4kTEsAC@localhost:3306/hdadmin_sfm",
      JWT_SECRET: "ssk_746ykyyc643n2837hdtnk69rsdahfzf3mv3wca9hzmqdr"
    },
    env_production: {
      NODE_ENV: "production",
      MYSQL_DATABASE_URL: "mysql://hdadmin_sfm:25Y7Pwsd6UKEh4kTEsAC@localhost:3306/hdadmin_sfm",
      JWT_SECRET: "ssk_746ykyyc643n2837hdtnk69rsdahfzf3mv3wca9hzmqdr"
    },
    watch: false,
    max_memory_restart: "200M"
  }]
} 
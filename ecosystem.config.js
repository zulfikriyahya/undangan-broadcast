module.exports = {
  apps: [
    {
      name: "undangan-broadcast",
      script: "./index.js", // sesuaikan dengan entry point app kamu
      cwd: "/var/www/undang.zedlabs.id",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        PORT: 4000, // sesuaikan port app kamu
      },
    },
  ],
};

module.exports = {
  apps: [
    {
      name: "undangan-broadcast",
      script: "./dist/server/entry.mjs",
      cwd: "/var/www/undang.zedlabs.id",
      interpreter: "node",
      interpreter_args: "--experimental-vm-modules",
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

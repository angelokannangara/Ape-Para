import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

const server = createApp().listen(config.port, () => {
  console.log(`Ape Para API listening on :${config.port}`);
});

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
const ngrok = require("@ngrok/ngrok");

async function startTunnel() {
  const forwarder = await ngrok.forward({
    addr: 5000, // Match your Express server port
    authtoken_from_env: true,
  });
  console.log(`Ngrok tunnel available at: ${forwarder.url()}`);
}

startTunnel();
import { bot } from './bot.js';
import { startServer } from './server.js';

async function main() {
  console.log('--- n8n Automation Sentinel Level 1 ---');
  
  // Start the Express Server
  startServer();

  // Start the Telegram Bot
  bot.launch()
    .then(() => console.log('Telegram Bot Polling Started.'))
    .catch((err) => console.error('Failed to launch bot:', err));

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch(console.error);

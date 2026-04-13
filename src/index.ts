import { bot, botService } from './bot.js';
import { startServer } from './server.js';
import { config } from './config.js';

async function preFlightCheck() {
  const required = ['GEMINI_API_KEY', 'TELEGRAM_BOT_TOKEN', 'N8N_API_KEY', 'N8N_URL'];
  const missing = required.filter(key => !process.env[key] || process.env[key]?.includes('YOUR_'));
  
  if (missing.length > 0) {
    console.error(`💀 INCIDENT: Missing or invalid environment variables: ${missing.join(', ')}`);
    // Attempt to notify Telegram if bot token exists
    if (process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.includes('YOUR_')) {
        try {
            await bot.telegram.sendMessage(config.telegram.userId, `💀 *IDENTIFICATION ERROR:* I am missing crucial identity files: \`${missing.join(', ')}\`. Please set them in Render env vars.`);
        } catch (e) {}
    }
    return false;
  }
  return true;
}

async function main() {
  console.log('--- Dave Jnr Automation Sentinel ---');
  
  if (!(await preFlightCheck())) {
    console.log('💀 Dave Jnr is offline due to identity issues.');
    return;
  }
  
  // Start the Express Server
  startServer();

  // Start the Telegram Bot
  bot.launch()
    .then(() => {
        console.log('Telegram Bot Polling Started.');
        botService.sendStartupMessage();
    })
    .catch((err: any) => console.error('Failed to launch bot:', err));

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch(console.error);

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    userId: Number(process.env.TELEGRAM_USER_ID) || 0,
  },
  n8n: {
    apiKey: process.env.N8N_API_KEY || '',
    baseUrl: process.env.N8N_URL?.replace(/\/$/, '') || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  }
};

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
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  }
};

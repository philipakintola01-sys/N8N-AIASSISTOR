import express from 'express';
import { config } from './config.js';
import { botService } from './bot.js';
import { n8nService } from './n8n.js';
import { getDashboardHtml } from './dashboard.js';
import { auditor } from './auditor.js';

const app = express();
app.use(express.json());

// Level 3: Monitoring Hub
app.get('/dashboard', async (req: any, res: any) => {
  try {
    const stats = auditor.getStats();
    res.send(getDashboardHtml(stats));
  } catch (err: any) {
    res.status(500).send(`💀 Dashboard Critical Error: ${err.message}`);
  }
});

// n8n Error Webhook
app.post('/n8n-error', async (req: any, res: any) => {
  console.log('Received error signal from n8n');
  const errorData = req.body;
  
  if (!errorData.workflow || !errorData.execution) {
    return res.status(400).send('Missing workflow or execution context');
  }

  // Trigger the bot notification and analysis
  botService.notifyError(errorData);
  
  res.status(200).send('Signal Received. Intelligence processing started.');
});

// Health/Keep-alive
app.get('/keep-alive', (req: any, res: any) => {
  res.status(200).send('Dave Jnr Online 💀');
});

export const startServer = () => {
  app.listen(config.server.port, () => {
    console.log(`💀 Dave Jnr Server online on port ${config.server.port}`);
  });
};

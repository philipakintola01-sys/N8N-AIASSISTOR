import express from 'express';
import { config } from './config';
import { botService } from './bot';

const app = express();
app.use(express.json());

// n8n Error Webhook
app.post('/n8n-error', async (req, res) => {
  console.log('Received error signal from n8n');
  const errorData = req.body;
  
  // We expect a payload from n8n's Error Trigger
  // { workflow: {...}, execution: {...}, error: {...} }
  
  if (!errorData.workflow || !errorData.execution) {
    return res.status(400).send('Missing workflow or execution context');
  }

  // Trigger the bot notification and analysis
  botService.notifyError(errorData);
  
  res.status(200).send('Signal Received. Intelligence processing started.');
});

// Health/Keep-alive endpoint for Render/Cron-job.org
app.get('/keep-alive', (req, res) => {
  res.status(200).send('Sentinel is awake.');
});

export const startServer = () => {
  app.listen(config.server.port, () => {
    console.log(`Sentinel Server online on port ${config.server.port}`);
    console.log(`Webhook endpoint: /n8n-error`);
    console.log(`Health endpoint: /keep-alive`);
  });
};

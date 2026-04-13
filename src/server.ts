import express from 'express';
import { config } from './config.js';
import { botService } from './bot.js';
import { n8nService } from './n8n.js';
import { getDashboardHtml } from './dashboard.js';
import { auditor } from './auditor.js';

const app = express();
app.use(express.json());

// Level 5: The Executive Protocol Hub
app.get('/dashboard', (req: any, res: any) => {
  const stats = auditor.getStats();
  res.send(getDashboardHtml(stats));
});

// Ephemeral Sharing Route (5-min TTL)
app.get('/monitor/share', (req: any, res: any) => {
    const token = req.query.token as string;
    if (!token) return res.status(400).send('💀 Access Denied: Missing Protocol Token.');
    
    const sharedData = auditor.getSharedData(token);
    if (!sharedData) {
        return res.status(410).send(`
            <body style="background:#05070a; color:#f85149; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0;">
                <h1 style="font-size:48px;">410 GONE</h1>
                <p style="opacity:0.6;">💀 Ephemeral protocol link expired (5-min TTL reached).</p>
                <div style="border-top:1px solid #30363d; margin-top:20px; padding-top:20px;">
                    <button onclick="window.close()" style="background:#f85149; border:none; color:white; padding:10px 20px; border-radius:4px; cursor:pointer;">Close Protocol</button>
                </div>
            </body>
        `);
    }

    res.send(getDashboardHtml({ recentExecutions: sharedData }, token));
});

// Generate Share Link
app.post('/monitor/generate-link', (req: any, res: any) => {
    const token = Math.random().toString(36).substring(2, 15);
    auditor.generateShareLink(token);
    const shareUrl = `${config.server.appUrl}/monitor/share?token=${token}`;
    res.json({ url: shareUrl, expires_in: '300s' });
});

app.post('/n8n-error', async (req: any, res: any) => {
  console.log('Received error signal from n8n');
  const errorData = req.body;
  
  if (errorData.workflow && errorData.execution) {
      botService.notifyError(errorData);
  }
  
  res.status(200).send('Signal Received. Intelligence processing started.');
});

app.get('/keep-alive', (req: any, res: any) => {
  res.status(200).send('Dave Jnr Online 💀');
});

export const startServer = () => {
  app.listen(config.server.port, () => {
    console.log(`💀 Dave Jnr Executive Server online on port ${config.server.port}`);
  });
};

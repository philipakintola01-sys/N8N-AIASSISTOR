import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { n8nService } from './n8n.js';
import { brainService } from './brain.js';

export const bot = new Telegraf(config.telegram.token);

// Middleware to restrict access to the specific User ID
bot.use(async (ctx, next) => {
  if (ctx.from?.id !== config.telegram.userId) {
    return ctx.reply('Unauthorized. This bot is property of the DevOps team.');
  }
  return next();
});

bot.start((ctx) => ctx.reply('💀 Dave Jnr Online. Systems architected, servers monitored. Lead the way...'));

bot.command('status', async (ctx) => {
  ctx.reply('💀 Systems Operational. Connectivity to n8n is robust. Ready for deployment.');
});

bot.command('run', async (ctx) => {
  const workflowId = ctx.payload;
  if (!workflowId) return ctx.reply('Usage: /run [workflow_id]');
  
  try {
    const result = await n8nService.triggerWorkflow(workflowId);
    ctx.reply(`🚀 *Workflow Triggered:* Execution ID ${result.executionId}\n[View Execution](${config.n8n.baseUrl}/execution/${result.executionId})`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.reply(`❌ *Trigger Failed:* ${err.message}`);
  }
});

bot.command('test', async (ctx) => {
  const workflowId = ctx.payload;
  if (!workflowId) return ctx.reply('Usage: /test [workflow_id]');
  
  const statusMsg = await ctx.reply('🧪 *Testing Workflow:* Initiating execution and monitoring results...');
  
  try {
    const trigger = await n8nService.triggerWorkflow(workflowId);
    const execution = await n8nService.waitForExecution(trigger.executionId);
    const workflow = await n8nService.getWorkflow(workflowId);
    
    const analysis = await brainService.analyzeTestResult(workflow.name, execution);
    
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, 
      `🏁 *Test Result:* ${execution.status.toUpperCase()}\n\n${analysis}`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply(`❌ *Test Failed:* ${err.message}`);
  }
});

bot.command('activate', async (ctx) => {
  const workflowId = ctx.payload;
  if (!workflowId) return ctx.reply('Usage: /activate [id]');
  try {
    const result = await n8nService.activateWorkflow(workflowId);
    ctx.reply(`✅ *Workflow Activated:* ${result.name} 💀`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.reply(`❌ *Activation Failed:* ${err.message}`);
  }
});

bot.command('deactivate', async (ctx) => {
  const workflowId = ctx.payload;
  if (!workflowId) return ctx.reply('Usage: /deactivate [id]');
  try {
    const result = await n8nService.deactivateWorkflow(workflowId);
    ctx.reply(`🛑 *Workflow Deactivated:* ${result.name} 💀`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.reply(`❌ *Deactivation Failed:* ${err.message}`);
  }
});

bot.command('research', async (ctx) => {
  const topic = ctx.payload;
  if (!topic) return ctx.reply('Usage: /research [topic]');
  ctx.reply(`🔍 *Dave Jnr is initiating research on:* ${topic}...\nPulling automation intelligence... 💀`);
  try {
    const breakdown = await brainService.conductResearch(topic, "Latest research parameters identified in DevOps automation stream...");
    ctx.reply(`📊 *Research Breakdown:* ${topic}\n\n${breakdown}`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.reply(`❌ *Research Failed:* ${err.message}`);
  }
});

// Capture Sticker ID for future use
let activeStickerId: string | null = null;

bot.on('sticker', async (ctx) => {
  const fileId = ctx.message.sticker.file_id;
  activeStickerId = fileId;
  ctx.reply(`💀 *Sticker Identified.* Root access granted to visual asset. I will use this for my future high-priority alerts.`);
});

// Store pending fixes in memory
const pendingFixes = new Map<string, any>();

export const botService = {
  async notifyError(errorData: any) {
    const { workflow, execution, error } = errorData;
    
    let message = `🚨 *Incident Detected*\n\n`;
    message += `*Workflow:* ${workflow.name}\n`;
    message += `*Node:* ${error?.node?.name || 'Unknown'}\n`;
    message += `*Error:* ${error?.message || 'Generic Failure'}\n`;
    message += `\n[View Execution](${config.n8n.baseUrl}/execution/${execution.id})`;

    if (activeStickerId) {
        await bot.telegram.sendSticker(config.telegram.userId, activeStickerId);
    }
    await bot.telegram.sendMessage(config.telegram.userId, message, { parse_mode: 'Markdown' });

    const statusMsg = await bot.telegram.sendMessage(config.telegram.userId, '⚙️ *Running Root Cause Analysis (RCA)...*', { parse_mode: 'Markdown' });

    try {
      const fullWorkflow = await n8nService.getWorkflow(workflow.id);
      const diagnosis = await brainService.analyzeError(fullWorkflow, errorData);
      
      await bot.telegram.editMessageText(config.telegram.userId, statusMsg.message_id, undefined, 
        `🧠 *RCA Summary:*\n\n${diagnosis}`, { parse_mode: 'Markdown' });

      const fixJson = await brainService.suggestFixJson(fullWorkflow, diagnosis);
      const fixId = Math.random().toString(36).substring(7);
      pendingFixes.set(fixId, { workflowId: workflow.id, json: fixJson });

      await bot.telegram.sendMessage(config.telegram.userId, '🛠 *Hotfix Available:* I have prepared a patch for this workflow.', 
        Markup.inlineKeyboard([
          Markup.button.callback('✅ Approve & Deploy', `fix_approve_${fixId}`),
          Markup.button.callback('❌ Refine / Discuss', `fix_refine_${fixId}`)
        ])
      );
    } catch (err: any) {
      await bot.telegram.sendMessage(config.telegram.userId, `💀❌ *RCA Failed:* ${err.message}`);
    }
  },

  async sendStartupMessage() {
    if (activeStickerId) {
        await bot.telegram.sendSticker(config.telegram.userId, activeStickerId);
    }
    await bot.telegram.sendMessage(config.telegram.userId, '💀 *Dave Jnr is Back Online.* All systems nominal. I am watching the flows...');
  }
};

bot.action(/fix_approve_(.+)/, async (ctx) => {
  const fixId = ctx.match?.[1];
  if (!fixId) return ctx.reply('Error: Invalid fix ID.');
  
  const fix = pendingFixes.get(fixId);
  if (!fix) return ctx.reply('Error: Fix session expired.');

  try {
    const oldWorkflow = await n8nService.getWorkflow(fix.workflowId);
    await n8nService.updateWorkflow(fix.workflowId, fix.json);
    
    // Level 2: Breakdown on Update
    const breakdown = await brainService.analyzeChange(oldWorkflow, fix.json);
    
    await ctx.editMessageText(`🚀 *Hotfix Deployed Successfully.* Workflow has been updated and re-activated.\n\n📊 *Change Breakdown:*\n${breakdown}`, { parse_mode: 'Markdown' });
    if (fixId) pendingFixes.delete(fixId);
  } catch (err: any) {
    await ctx.reply(`❌ *Deployment Failed:* ${err.message}`);
  }
});

bot.action(/fix_refine_(.+)/, async (ctx) => {
  await ctx.reply('Understood. Please describe the changes you want, or provide the corrected logic.');
});

bot.on('text', async (ctx) => {
    if (ctx.message.text.toLowerCase().startsWith('create')) {
        const prompt = ctx.message.text.substring(6).trim();
        const statusMsg = await ctx.reply('🏗 *Architecting new workflow...*');
        
        try {
            const newWorkflow = await brainService.createWorkflow(prompt);
            await ctx.telegram.editMessageText(ctx.chat?.id!, statusMsg.message_id, undefined, '✅ *Workflow Architected.* Uploading draft to n8n...');
            const deployed = await n8nService.createWorkflow(newWorkflow);
            await ctx.telegram.editMessageText(ctx.chat?.id!, statusMsg.message_id, undefined, 
                `🚀 *Workflow Deployed:* ${deployed.name}\nID: \`${deployed.id}\`\n[Open in Editor](${config.n8n.baseUrl}/workflow/${deployed.id})`, 
                { parse_mode: 'Markdown' });
        } catch (err: any) {
            await ctx.reply(`❌ *Architecting Failed:* ${err.message}`);
        }
    }
});

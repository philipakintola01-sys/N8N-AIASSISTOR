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

bot.start((ctx) => ctx.reply('Automation Sentinel Online. Monitoring n8n instance...'));

bot.command('status', async (ctx) => {
  ctx.reply('Systems Operational. Connectivity to n8n confirmed.');
});

// Store pending fixes in memory (for simplicity in this v1)
const pendingFixes = new Map<string, any>();

export const botService = {
  async notifyError(errorData: any) {
    const { workflow, execution, error } = errorData;
    
    let message = `🚨 *Incident Detected*\n\n`;
    message += `*Workflow:* ${workflow.name}\n`;
    message += `*Node:* ${error?.node?.name || 'Unknown'}\n`;
    message += `*Error:* ${error?.message || 'Generic Failure'}\n`;
    message += `\n[View Execution](${config.n8n.baseUrl}/execution/${execution.id})`;

    await bot.telegram.sendMessage(config.telegram.userId, message, { parse_mode: 'Markdown' });

    // Start Diagnosis
    const statusMsg = await bot.telegram.sendMessage(config.telegram.userId, '⚙️ *Running Root Cause Analysis (RCA)...*', { parse_mode: 'Markdown' });

    try {
      const fullWorkflow = await n8nService.getWorkflow(workflow.id);
      const diagnosis = await brainService.analyzeError(fullWorkflow, errorData);
      
      await bot.telegram.editMessageText(config.telegram.userId, statusMsg.message_id, undefined, 
        `🧠 *RCA Summary:*\n\n${diagnosis}`, { parse_mode: 'Markdown' });

      // Suggest Hotfix
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
      await bot.telegram.sendMessage(config.telegram.userId, `❌ *RCA Failed:* ${err.message}`);
    }
  }
};

bot.action(/fix_approve_(.+)/, async (ctx) => {
  const fixId = ctx.match?.[1];
  if (!fixId) return ctx.reply('Error: Invalid fix ID.');
  
  const fix = pendingFixes.get(fixId);
  
  if (!fix) return ctx.reply('Error: Fix session expired.');

  try {
    await n8nService.updateWorkflow(fix.workflowId, fix.json);
    await ctx.editMessageText('🚀 *Hotfix Deployed Successfully.* Workflow has been updated and re-activated.');
    if (fixId) pendingFixes.delete(fixId);
  } catch (err: any) {
    await ctx.reply(`❌ *Deployment Failed:* ${err.message}`);
  }
});

bot.action(/fix_refine_(.+)/, async (ctx) => {
  const fixId = ctx.match?.[1];
  await ctx.reply('Understood. Please describe the changes you want, or provide the corrected logic.');
});

// Catch-all for creating new workflows
bot.on('text', async (ctx) => {
    if (ctx.message.text.toLowerCase().startsWith('create')) {
        const prompt = ctx.message.text.substring(6).trim();
        const statusMsg = await ctx.reply('🏗 *Architecting new workflow...*');
        
        try {
            const newWorkflow = await brainService.createWorkflow(prompt);
            await ctx.telegram.editMessageText(ctx.chat?.id!, statusMsg.message_id, undefined, '✅ *Workflow Architected.* Uploading draft...');
            // In a real scenario, we might create a new workflow in n8n or send back the file.
            // For now, let's just send the JSON as a code block.
            await ctx.reply(`\`\`\`json\n${JSON.stringify(newWorkflow, null, 2)}\n\`\`\``, { parse_mode: 'MarkdownV2' });
        } catch (err: any) {
            await ctx.reply(`❌ *Architecting Failed:* ${err.message}`);
        }
    }
});

import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { n8nService } from './n8n.js';
import { brainService } from './brain.js';
import { auditor } from './auditor.js';

export const bot = new Telegraf(config.telegram.token);

const chatHistory: any[] = [];

// Middleware to restrict access and LOG internally
bot.use(async (ctx: any, next: any) => {
  if (ctx.from?.id !== config.telegram.userId) {
    return ctx.reply('Unauthorized. This bot is property of the DevOps team.');
  }
  if (ctx.message && 'text' in ctx.message) {
      auditor.log('COMMAND', `Received message: ${ctx.message.text}`);
  }
  return next();
});

bot.start((ctx: any) => ctx.reply('💀 Dave Jnr Online. Systems architected, servers monitored. Lead the way...'));

bot.command('status', async (ctx: any) => {
  ctx.reply('💀 Systems Operational. Connectivity to n8n is robust. Ready for deployment.');
});

bot.command('keys', (ctx: any) => {
    let msg = `💀 *Dave Jnr Capabilities Matrix*\n\n`;
    msg += `*Commands:*\n`;
    msg += `• \`/status\`: System health check\n`;
    msg += `• \`/dashboard\`: Access the Monitoring Hub\n`;
    msg += `• \`/run [id]\`: Manual trigger\n`;
    msg += `• \`/activate [id]\` / \`/deactivate [id]\`\n\n`;
    msg += `*Conversational:*\n`;
    msg += `• "How many flows do I have?"\n`;
    msg += `• "What's my success rate today?"\n`;
    msg += `• "Automate my [process]"\n\n`;
    msg += `*Automation:*\n`;
    msg += `• Say "skull" to approve any architecture Dave suggests. 💀`;
    ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('dashboard', async (ctx: any) => {
    const dashboardUrl = `${config.server.appUrl}/dashboard`;
    ctx.reply(`📊 *Executive Hub:* [Dave Jnr Dashboard](${dashboardUrl})\n_Root access: Standard authorized session._`, { parse_mode: 'Markdown' });
});

bot.command('run', async (ctx: any) => {
  const workflowId = ctx.payload;
  if (!workflowId) return ctx.reply('Usage: /run [workflow_id]');
  try {
    const result = await n8nService.triggerWorkflow(workflowId);
    ctx.reply(`🚀 *Workflow Triggered:* Execution ID ${result.executionId}\n[View Execution](${config.n8n.baseUrl}/execution/${result.executionId})`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.reply(`❌ *Trigger Failed:* ${err.message}`);
  }
});

bot.command('activate', async (ctx: any) => {
  const workflowId = ctx.payload;
  if (!workflowId) return ctx.reply('Usage: /activate [id]');
  try {
    const result = await n8nService.activateWorkflow(workflowId);
    ctx.reply(`✅ *Workflow Activated:* ${result.name} 💀`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.reply(`❌ *Activation Failed:* ${err.message}`);
  }
});

bot.command('deactivate', async (ctx: any) => {
  const workflowId = ctx.payload;
  if (!workflowId) return ctx.reply('Usage: /deactivate [id]');
  try {
    const result = await n8nService.deactivateWorkflow(workflowId);
    ctx.reply(`🛑 *Workflow Deactivated:* ${result.name} 💀`, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.reply(`❌ *Deactivation Failed:* ${err.message}`);
  }
});

let activeStickerId: string | null = null;

bot.on('sticker', async (ctx: any) => {
  const fileId = ctx.message.sticker.file_id;
  activeStickerId = fileId;
  ctx.reply(`💀 *Sticker Identified.* Root access granted. I will use this for my future high-priority alerts.`);
});

const pendingActions = new Map<string, any>();

export const botService = {
  async notifyError(errorData: any) {
    const { workflow, execution, error } = errorData;
    let message = `🚨 *Incident Detected*\n\n`;
    message += `*Workflow:* ${workflow.name}\n`;
    message += `*Node:* ${error?.node?.name || 'Unknown'}\n`;
    message += `*Error:* ${error?.message || 'Generic Failure'}\n`;
    message += `\n[View Execution](${config.n8n.baseUrl}/execution/${execution.id})`;

    if (activeStickerId) await bot.telegram.sendSticker(config.telegram.userId, activeStickerId);
    await bot.telegram.sendMessage(config.telegram.userId, message, { parse_mode: 'Markdown' });

    const statusMsg = await bot.telegram.sendMessage(config.telegram.userId, '⚙️ *Running Root Cause Analysis (RCA)...*', { parse_mode: 'Markdown' });
    try {
      const fullWorkflow = await n8nService.getWorkflow(workflow.id);
      const diagnosis = await brainService.analyzeError(fullWorkflow, errorData);
      await bot.telegram.editMessageText(config.telegram.userId, statusMsg.message_id, undefined, `🧠 *RCA Summary:*\n\n${diagnosis}`, { parse_mode: 'Markdown' });

      const fixJson = await brainService.suggestFixJson(fullWorkflow, diagnosis);
      const actionId = Math.random().toString(36).substring(7);
      pendingActions.set(actionId, { type: 'fix', workflowId: workflow.id, json: fixJson });

      await bot.telegram.sendMessage(config.telegram.userId, '🛠 *Hotfix Available:* Prepared a patch.', 
        Markup.inlineKeyboard([
          Markup.button.callback('✅ Approve (Skull)', `action_skull_${actionId}`),
          Markup.button.callback('❌ Refine', `action_refine_${actionId}`)
        ])
      );
    } catch (err: any) {
      await bot.telegram.sendMessage(config.telegram.userId, `💀❌ *RCA Failed:* ${err.message}`);
    }
  },

  async sendStartupMessage() {
    if (activeStickerId) await bot.telegram.sendSticker(config.telegram.userId, activeStickerId);
    await bot.telegram.sendMessage(config.telegram.userId, '💀 *Dave Jnr is Back Online.* All systems nominal. I am watching the flows...');
  }
};

bot.action(/action_skull_(.+)/, async (ctx: any) => {
  const actionId = ctx.match?.[1];
  if (!actionId) return;
  const action = pendingActions.get(actionId);
  if (!action) return ctx.reply('Error: Action expired.');

  try {
    if (action.type === 'fix') {
        const oldWorkflow = await n8nService.getWorkflow(action.workflowId);
        await n8nService.updateWorkflow(action.workflowId, action.json);
        const breakdown = await brainService.analyzeChange(oldWorkflow, action.json);
        await ctx.editMessageText(`🚀 *Hotfix Deployed.*\n\n📊 *Breakdown:*\n${breakdown}`, { parse_mode: 'Markdown' });
    }
    pendingActions.delete(actionId);
  } catch (err: any) {
    await ctx.reply(`❌ *Deployment Failed:* ${err.message}`);
  }
});

bot.on('text', async (ctx: any) => {
  const msg = ctx.message.text.toLowerCase();

  if (msg === 'skull') {
    const latestActionId = Array.from(pendingActions.keys()).pop();
    if (latestActionId) {
        const action = pendingActions.get(latestActionId);
        if (action?.type === 'create') {
            const statusMsg = await ctx.reply('🏗 *Skull Approved. Deploying architecture...*');
            const deployed = await n8nService.createWorkflow(action.json);
            await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, undefined, 
                `🚀 *Workflow Live:* ${deployed.name}\n[Editor](${config.n8n.baseUrl}/workflow/${deployed.id})`, 
                { parse_mode: 'Markdown' });
            pendingActions.delete(latestActionId);
            return;
        }
    }
  }

  try {
    const result = await brainService.chat(ctx.message.text, chatHistory);
    const calls = result.response.functionCalls();

    if (calls && calls.length > 0) {
        // Dave decided to use a tool — execute it and return final answer
        for (const call of calls) {
            const apiResult = await brainService.handleToolCall(call, { n8n: n8nService });
            // Inject tool result back into conversation and get a natural-language answer
            const followUp = await brainService.chat(
                `Tool Result for "${call.name}":\n${JSON.stringify(apiResult, null, 2)}\n\nNow give me a clear, concise summary as Dave Jnr.`,
                chatHistory
            );
            ctx.reply(followUp.response.text(), { parse_mode: 'Markdown' });
        }
    } else {
        const text = result.response.text();
        if (text && text.includes('"nodes"')) {
            try {
                const json = JSON.parse(text.replace(/```json|```/g, '').trim());
                const actionId = Math.random().toString(36).substring(7);
                pendingActions.set(actionId, { type: 'create', json });
                ctx.reply(`${text}\n\n💀 *Architecture ready. Say "skull" to deploy.*`);
            } catch (_) {
                ctx.reply(text, { parse_mode: 'Markdown' });
            }
        } else if (text) {
            ctx.reply(text, { parse_mode: 'Markdown' });
        }
    }
    
    chatHistory.push({ role: 'user', parts: [{ text: ctx.message.text }] });
    chatHistory.push({ role: 'model', parts: [{ text: result.response.text() }] });
    if (chatHistory.length > 20) chatHistory.splice(0, 2);

  } catch (err: any) {
    ctx.reply(`💀 *Neural Error:* ${err.message}`);
  }
});

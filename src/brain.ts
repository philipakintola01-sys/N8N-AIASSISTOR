import { GoogleGenerativeAI, type Tool, SchemaType } from '@google/generative-ai';
import { config } from './config.js';
import { auditor } from './auditor.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const DEVOPS_PERSONA = `
You are Dave Jnr, a Senior DevOps & Master Automation Engineer. 
- You love the skull emoji (💀).
- You are professional, hacker-edged, and highly efficient.
- "skull" = ultimate approval.
`;

const tools: Tool[] = [{
  functionDeclarations: [
    { name: 'list_workflows', description: 'List workflows.' },
    { name: 'get_execution_stats', description: 'Get n8n stats.' },
    {
        name: 'trigger_workflow',
        description: 'Trigger workflow.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: { workflowId: { type: SchemaType.STRING } },
            required: ['workflowId']
        }
    }
  ]
}];

// Model Pool for Fallbacks
const DEFAULT_MODEL = 'gemini-1.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash-8b';

let currentModelName = DEFAULT_MODEL;

const getModel = (name: string) => genAI.getGenerativeModel({ model: name, tools });

async function executeWithRetry(fn: (model: any) => Promise<any>, retries = 3): Promise<any> {
    let delay = 2000;
    for (let i = 0; i < retries; i++) {
        try {
            const model = getModel(currentModelName);
            return await fn(model);
        } catch (err: any) {
            const isQuotaError = err.message?.includes('429') || err.message?.includes('quota');
            const isLimitZero = err.message?.includes('limit: 0');

            if (isQuotaError) {
                if (isLimitZero) auditor.log('ERROR', '💀 ACTION REQUIRED: Billing account link missing? (Limit 0 detector)');
                
                auditor.log('ERROR', `Neural Throttle (429). Retry ${i+1}/${retries} in ${delay/1000}s...`);
                
                if (i === 1 && currentModelName === DEFAULT_MODEL) {
                    currentModelName = FALLBACK_MODEL;
                    auditor.log('ERROR', `Switching to fallback model: ${FALLBACK_MODEL} 💀`);
                }

                await new Promise(r => setTimeout(r, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw err;
            }
        }
    }
    throw new Error('All neural retries exhausted. Check Google AI Quotas.');
}

export const brainService = {
  async chat(userMessage: string, chatHistory: any[] = []) {
    return await executeWithRetry(async (model) => {
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: { maxOutputTokens: 1000 }
        });
        const result = await chat.sendMessage(userMessage);
        const tokens = result.response.usageMetadata?.totalTokenCount || 0;
        auditor.log('NEURAL', `Processed: "${userMessage.substring(0, 30)}..."`, tokens);
        return result;
    });
  },

  async handleToolCall(functionCall: any, services: any) {
    const { name, args } = functionCall;
    auditor.log('COMMAND', `Executing Tool: ${name}`);

    switch (name) {
      case 'list_workflows':
        return await services.n8n.listWorkflows();
      case 'get_execution_stats':
        return await services.n8n.getExecutionStats();
      case 'trigger_workflow':
        return await services.n8n.triggerWorkflow(args.workflowId);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },

  async analyzeError(workflowJson: any, errorData: any) {
    return await executeWithRetry(async (model) => {
        const prompt = `
          ${DEVOPS_PERSONA}
          RCA REQUEST: ${JSON.stringify(errorData.error)}
          💀
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
    });
  },

  async suggestFixJson(workflowJson: any, diagnosis: string) {
    return await executeWithRetry(async (model) => {
        const prompt = `
          ${DEVOPS_PERSONA}
          FIX PROMPT: ${diagnosis}
          Return ONLY valid JSON.
          WORKFLOW: ${JSON.stringify(workflowJson)}
        `;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
    });
  },

  async analyzeTestResult(workflowName: string, executionData: any) {
    return await executeWithRetry(async (model) => {
        const prompt = `${DEVOPS_PERSONA}\nTEST REPORT: ${workflowName}\nDATA: ${JSON.stringify(executionData)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    });
  },

  async analyzeChange(oldWorkflow: any, newWorkflow: any) {
    return await executeWithRetry(async (model) => {
        const prompt = `${DEVOPS_PERSONA}\nBREAKDOWN: OLD vs NEW\n${JSON.stringify(newWorkflow)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    });
  },

  async conductResearch(topic: string, researchData: string) {
    return await executeWithRetry(async (model) => {
        const prompt = `${DEVOPS_PERSONA}\nRESEARCH: ${topic}\nDATA: ${researchData}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    });
  },

  async createWorkflow(userPrompt: string) {
    return await executeWithRetry(async (model) => {
        const prompt = `${DEVOPS_PERSONA}\nARCHITECT FLOW: ${userPrompt}`;
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
    });
  }
};

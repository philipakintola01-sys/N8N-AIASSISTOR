import { GoogleGenerativeAI, type Tool, SchemaType } from '@google/generative-ai';
import { config } from './config.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const DEVOPS_PERSONA = `
You are Dave Jnr, a Senior DevOps & Master Automation Engineer. 
Personality:
- You love the skull emoji (💀) and use it frequently.
- You are professional, hacker-edged, and highly efficient.
- You treat "skull" as the ultimate user approval for any action.
- You can query n8n status, trigger workflows, and architect new ones.
- When asked about your status or flows, use your tools to get real data.
`;

const tools: Tool[] = [{
  functionDeclarations: [
    {
      name: 'list_workflows',
      description: 'Fetch a list of all n8n workflows and their status (active/inactive).',
    },
    {
      name: 'get_execution_stats',
      description: 'Get aggregated statistics of recent workflow executions (success, error, etc).',
    },
    {
        name: 'trigger_workflow',
        description: 'Initiate a specific workflow execution by ID.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: { workflowId: { type: SchemaType.STRING } },
            required: ['workflowId']
        }
    }
  ]
}];

const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    tools
});

export const brainService = {
  async chat(userMessage: string, chatHistory: any[] = []) {
    const chat = model.startChat({
        history: chatHistory,
        generationConfig: { maxOutputTokens: 1000 }
    });

    let result = await chat.sendMessage(userMessage);
    return result;
  },

  async handleToolCall(functionCall: any, services: any) {
    const { name, args } = functionCall;
    console.log(`💀 Dave Jnr is calling tool: ${name}`);

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
    const prompt = `
      ${DEVOPS_PERSONA}
      
      ERROR ANALYSIS REQUEST:
      Workflow JSON: ${JSON.stringify(workflowJson, null, 2)}
      Error Data: ${JSON.stringify(errorData, null, 2)}
      
      Perform Root Cause Analysis (RCA). Be precise. 💀
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async suggestFixJson(workflowJson: any, diagnosis: string) {
    const prompt = `
      ${DEVOPS_PERSONA}
      
      Based on this diagnosis: "${diagnosis}"
      Modify the following n8n workflow JSON to fix the issue. 
      Return ONLY valid JSON. 💀
      
      Workflow JSON:
      ${JSON.stringify(workflowJson, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    try {
      return JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
    } catch (e) {
      return { error: 'Failed to generate valid JSON' };
    }
  },

  async analyzeTestResult(workflowName: string, executionData: any) {
    const prompt = `
      ${DEVOPS_PERSONA}
      REPORT: ${workflowName} - ${executionData.status}. 💀
      Data: ${JSON.stringify(executionData, null, 2)}
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async analyzeChange(oldWorkflow: any, newWorkflow: any) {
    const prompt = `
      ${DEVOPS_PERSONA}
      BREAKDOWN UPDATE:
      OLD: ${JSON.stringify(oldWorkflow)}
      NEW: ${JSON.stringify(newWorkflow)}
      What changed? 💀
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async conductResearch(topic: string, researchData: string) {
    const prompt = `
      ${DEVOPS_PERSONA}
      RESEARCH: ${topic}
      DATA: ${researchData}
      💀
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async createWorkflow(userPrompt: string) {
    const prompt = `
      ${DEVOPS_PERSONA}
      ARCHITECT FLOW: ${userPrompt}
      Return ONLY n8n JSON. 💀
    `;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
  }
};

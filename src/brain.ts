import axios from 'axios';
import { config } from './config.js';
import { auditor } from './auditor.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const DEVOPS_PERSONA = `
You are Dave Jnr, a Senior DevOps & Master Automation Engineer. 
- You love the skull emoji (💀).
- "skull" = ultimate approval.
`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'list_workflows',
      description: 'Fetch a list of all n8n workflows and their status (active/inactive).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_execution_stats',
      description: 'Get aggregated statistics of recent workflow executions (success, error, etc).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'trigger_workflow',
      description: 'Initiate a specific workflow execution by ID.',
      parameters: {
        type: 'object',
        properties: { workflowId: { type: 'string' } },
        required: ['workflowId']
      }
    }
  }
];

async function callOpenRouter(messages: any[], useTools = true) {
  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: config.openrouter.model,
      messages,
      tools: useTools ? tools : undefined,
    },
    {
      headers: {
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
        'HTTP-Referer': 'https://github.com/philipakintola01-sys/N8N-AIASSISTOR',
        'X-Title': 'Dave Jnr Sentinel',
        'Content-Type': 'application/json',
      },
    }
  );

  const usage = response.data.usage?.total_tokens || 0;
  return { data: response.data, tokens: usage };
}

export const brainService = {
  async chat(userMessage: string, chatHistory: any[] = []) {
    let messages: any[] = [
        { role: 'system', content: DEVOPS_PERSONA },
        ...chatHistory.map((h: any) => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: typeof h.parts[0].text === 'string' ? h.parts[0].text : JSON.stringify(h.parts[0])
        })),
        { role: 'user', content: userMessage }
    ];

    try {
        let { data, tokens } = await callOpenRouter(messages);
        const choice = data.choices[0].message;

        if (choice.tool_calls) {
            auditor.log('NEURAL', 'Internal Tool Loop Triggered 💀', tokens);
            return { response: { text: () => JSON.stringify(choice), functionCalls: () => choice.tool_calls.map((c: any) => ({ name: c.function.name, args: JSON.parse(c.function.arguments) })) } };
        }

        auditor.log('NEURAL', `Processed: "${userMessage.substring(0, 30)}..."`, tokens);
        return { response: { text: () => choice.content, functionCalls: () => null } };
    } catch (err: any) {
        auditor.log('ERROR', `Neural Failure: ${err.message}`);
        throw err;
    }
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
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Analyze this n8n error: ${JSON.stringify(errorData.error)} 💀` }
    ];
    const { data } = await callOpenRouter(messages, false);
    return data.choices[0].message.content;
  },

  async suggestFixJson(workflowJson: any, diagnosis: string) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Suggest a JSON fix for this diagnosis: ${diagnosis}. Return ONLY JSON. 💀\nWorkflow: ${JSON.stringify(workflowJson)}` }
    ];
    const { data } = await callOpenRouter(messages, false);
    const text = data.choices[0].message.content;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  },

  async analyzeTestResult(workflowName: string, executionData: any) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Explain this test result for ${workflowName}: ${JSON.stringify(executionData)} 💀` }
    ];
    const { data } = await callOpenRouter(messages, false);
    return data.choices[0].message.content;
  },

  async analyzeChange(oldWorkflow: any, newWorkflow: any) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `List changes in this workflow update: ${JSON.stringify(newWorkflow)} 💀` }
    ];
    const { data } = await callOpenRouter(messages, false);
    return data.choices[0].message.content;
  },

  async conductResearch(topic: string, researchData: string) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Research synthesis for ${topic}: ${researchData} 💀` }
    ];
    const { data } = await callOpenRouter(messages, false);
    return data.choices[0].message.content;
  },

  async createWorkflow(userPrompt: string) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Create n8n JSON for: ${userPrompt}. Return ONLY JSON. 💀` }
    ];
    const { data } = await callOpenRouter(messages, false);
    return JSON.parse(data.choices[0].message.content.replace(/```json|```/g, '').trim());
  }
};

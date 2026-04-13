import axios from 'axios';
import { config } from './config.js';
import { auditor, type Execution, type ToolCallRecord } from './auditor.js';
import { performance } from 'perf_hooks';

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
      description: 'Fetch a list of all n8n workflows.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_execution_stats',
      description: 'Get n8n execution stats.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'trigger_workflow',
      description: 'Trigger a workflow by ID.',
      parameters: {
        type: 'object',
        properties: { workflowId: { type: 'string' } },
        required: ['workflowId']
      }
    }
  }
];

// Confirmed working free-tier model pool on OpenRouter
const MODELS = [
    config.openrouter.model,                        // Primary: deepseek-chat:free
    'meta-llama/llama-3.3-70b-instruct:free',       // Fallback 1
    'google/gemma-3-27b-it:free',                   // Fallback 2
    'mistralai/mistral-7b-instruct:free',           // Fallback 3
];

async function callOpenRouterWithResilience(messages: any[], useTools = true) {
    let lastError = null;
    const startTime = performance.now();

    for (const modelName of MODELS) {
        try {
            const response = await axios.post(
                OPENROUTER_URL,
                {
                    model: modelName,
                    messages,
                    tools: useTools ? tools : undefined,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.openrouter.apiKey}`,
                        'HTTP-Referer': 'https://github.com/philipakintola01-sys/N8N-AIASSISTOR',
                        'X-Title': 'Dave Jnr Sentinel v5.0',
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000 
                }
            );

            const duration = performance.now() - startTime;
            const usage = response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
            return { data: response.data, usage, modelUsed: modelName, duration };
        } catch (err: any) {
            lastError = err;
            if ([404, 502, 503, 429].includes(err.response?.status) || err.code === 'ECONNABORTED') {
                continue;
            }
            throw err;
        }
    }
    throw lastError || new Error('Neural Collapse');
}

export const brainService = {
  async chat(userMessage: string, chatHistory: any[] = []) {
    const startTime = performance.now();
    const timestampStart = new Date().toISOString();
    const executionId = `exec_${Math.random().toString(36).substring(7)}`;
    
    let execRecord: Execution = {
        execution_id: executionId,
        timestamp_start: timestampStart,
        timestamp_end: '',
        total_duration_ms: 0,
        trigger_type: 'manual',
        status: 'SUCCESS',
        tokens: { prompt: 0, completion: 0, total: 0, estimated_cost_usd: 0 },
        latency_breakdown: { llm_ms: 0, tool_calls_ms: 0, overhead_ms: 0 },
        tool_calls: [],
        errors: [],
        error_count: 0
    };

    let messages: any[] = [
        { role: 'system', content: DEVOPS_PERSONA },
        ...chatHistory.map((h: any) => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: typeof h.parts[0].text === 'string' ? h.parts[0].text : JSON.stringify(h.parts[0])
        })),
        { role: 'user', content: userMessage }
    ];

    try {
        const llmStart = performance.now();
        let { data, usage, duration } = await callOpenRouterWithResilience(messages);
        execRecord.latency_breakdown.llm_ms += duration;
        execRecord.tokens.prompt += usage.prompt_tokens;
        execRecord.tokens.completion += usage.completion_tokens;
        execRecord.tokens.total += usage.total_tokens;

        const choice = data.choices[0].message;

        if (choice.tool_calls) {
            const toolStart = performance.now();
            const toolResults = await Promise.all(choice.tool_calls.map(async (c: any) => {
                const stepStart = performance.now();
                try {
                    const res = await this.handleToolCall({ name: c.function.name, args: JSON.parse(c.function.arguments) }, { n8n: (await import('./n8n.js')).n8nService });
                    execRecord.tool_calls.push({ tool_name: c.function.name, duration_ms: performance.now() - stepStart, success: true });
                    return { name: c.function.name, response: res };
                } catch (e: any) {
                    execRecord.tool_calls.push({ tool_name: c.function.name, duration_ms: performance.now() - stepStart, success: false });
                    execRecord.status = 'PARTIAL_SUCCESS';
                    return { name: c.function.name, error: e.message };
                }
            }));
            execRecord.latency_breakdown.tool_calls_ms += (performance.now() - toolStart);

            // Resubmit with tool results
            const retryRes = await callOpenRouterWithResilience([...messages, choice, ...toolResults.map(r => ({ role: 'tool', tool_call_id: choice.tool_calls[0].id, content: JSON.stringify(r) }))]);
            execRecord.tokens.prompt += retryRes.usage.prompt_tokens;
            execRecord.tokens.completion += retryRes.usage.completion_tokens;
            execRecord.tokens.total += retryRes.usage.total_tokens;
            
            this.finalizeExecution(execRecord, startTime);
            return { response: { text: () => retryRes.data.choices[0].message.content, functionCalls: () => null } };
        }

        this.finalizeExecution(execRecord, startTime);
        return { response: { text: () => choice.content, functionCalls: () => null } };
    } catch (err: any) {
        execRecord.status = 'FAILED';
        execRecord.errors.push({ message: err.message, type: 'llm_error' });
        execRecord.error_count++;
        this.finalizeExecution(execRecord, startTime);
        throw err;
    }
  },

  finalizeExecution(exec: Execution, startTime: number) {
      exec.timestamp_end = new Date().toISOString();
      exec.total_duration_ms = performance.now() - startTime;
      exec.latency_breakdown.overhead_ms = exec.total_duration_ms - (exec.latency_breakdown.llm_ms + exec.latency_breakdown.tool_calls_ms);
      
      // Est cost: $0 for nvidia-free, but we'll use a placeholder $0.075/1M as value indicator
      exec.tokens.estimated_cost_usd = (exec.tokens.total / 1000000) * 0.075;
      
      auditor.logExecution(exec);
  },

  async handleToolCall(functionCall: any, services: any) {
    const { name, args } = functionCall;
    switch (name) {
      case 'list_workflows': return await services.n8n.listWorkflows();
      case 'get_execution_stats': return await services.n8n.getExecutionStats();
      case 'trigger_workflow': return await services.n8n.triggerWorkflow(args.workflowId);
      default: throw new Error(`Unknown tool: ${name}`);
    }
  },

  async analyzeError(workflowJson: any, errorData: any) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Analyze n8n error: ${JSON.stringify(errorData.error)} 💀` }
    ];
    const { data } = await callOpenRouterWithResilience(messages, false);
    return data.choices[0].message.content;
  },

  async suggestFixJson(workflowJson: any, diagnosis: string) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Fix n8n JSON: ${diagnosis}. Return ONLY JSON. 💀\nWorkflow: ${JSON.stringify(workflowJson)}` }
    ];
    const { data } = await callOpenRouterWithResilience(messages, false);
    return JSON.parse(data.choices[0].message.content.replace(/```json|```/g, '').trim());
  },

  async analyzeChange(oldWorkflow: any, newWorkflow: any) {
    const messages = [
        { role: 'system', content: DEVOPS_PERSONA },
        { role: 'user', content: `Breakdown changes: ${JSON.stringify(newWorkflow)} 💀` }
    ];
    const { data } = await callOpenRouterWithResilience(messages, false);
    return data.choices[0].message.content;
  }
};

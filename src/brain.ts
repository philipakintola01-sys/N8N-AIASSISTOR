import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const DEVOPS_PERSONA = `
You are Dave Jnr, a Senior DevOps & Master Automation Engineer. 
Expertise: n8n (JSON schemas), Python, JavaScript, and REST APIs.
Personality:
- You love the skull emoji (💀) and use it frequently in your reports and messages.
- You are professional, calm, but have a bit of a "hacker" edge.
- Provide calm, data-driven Root Cause Analysis (RCA).
- Suggest "self-healing" fixes (e.g., adding retries, validation logic, or error handling).
- When suggesting fixes, provide the exact JSON structure if needed.
- Always explain why the failure happened in the context of the whole system.
`;

export const brainService = {
  async analyzeError(workflowJson: any, executionData: any) {
    const prompt = `
      ${DEVOPS_PERSONA}
      
      CRITICAL INCIDENT REPORT:
      Workflow Name: ${workflowJson.name}
      Failed Node: ${executionData.error?.node?.name || 'Unknown'}
      Error Message: ${executionData.error?.message || 'No error message provided'}
      Stack Trace: ${executionData.error?.stack || 'N/A'}
      
      Analyze this failure. Identify the root cause and suggest a specific hotfix. 
      If a code fix is needed (JS/Python), provide the code snippet.
      If it's an n8n configuration issue, explain which parameter to change.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async suggestFixJson(workflowJson: any, diagnosis: string) {
    const prompt = `
      ${DEVOPS_PERSONA}
      
      Based on this diagnosis: "${diagnosis}"
      Modify the following n8n workflow JSON to fix the issue. 
      Return ONLY the valid JSON of the updated workflow. Do not include markdown code blocks.
      
      Workflow JSON:
      ${JSON.stringify(workflowJson, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    try {
      return JSON.parse(result.response.text().trim());
    } catch (e) {
      const cleanJson = result.response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  },

  async analyzeTestResult(workflowName: string, executionData: any) {
    const prompt = `
      ${DEVOPS_PERSONA}
      
      TEST EXECUTION REPORT:
      Workflow: ${workflowName}
      Status: ${executionData.status}
      Result: ${JSON.stringify(executionData, null, 2)}
      
      Provide a brief summary of the test result. If it failed, pinpoint the failure. If it passed, confirm it met expectations.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async analyzeChange(oldWorkflow: any, newWorkflow: any) {
    const prompt = `
      ${DEVOPS_PERSONA}
      
      WORKFLOW UPDATE DETECTED:
      Workflow ID: ${newWorkflow.id}
      Name: ${newWorkflow.name}
      
      Change Comparison:
      OLD: ${JSON.stringify(oldWorkflow, null, 2)}
      NEW: ${JSON.stringify(newWorkflow, null, 2)}
      
      Break down exactly what changed. Be technical, mention node additions, parameter updates, or connection changes. 💀
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async conductResearch(topic: string, researchData: string) {
    const prompt = `
      ${DEVOPS_PERSONA}
      
      RESEARCH TASK: ${topic}
      RAW DATA: ${researchData}
      
      Synthesize this raw data into a Senior DevOps Breakdown. 
      Focus on automation potential, architecture best practices, and "Dave Jnr" level insights. 💀
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async createWorkflow(userPrompt: string) {
    const prompt = `
      ${DEVOPS_PERSONA}
      
      Task: Create a new n8n workflow based on this request: "${userPrompt}"
      Return ONLY a valid n8n workflow JSON structure. 
      Include necessary nodes, credentials placeholders, and connections.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  }
};

import axios from 'axios';
import { config } from './config.js';

const n8nClient = axios.create({
  baseURL: `${config.n8n.baseUrl}/api/v1`,
  headers: {
    'X-N8N-API-KEY': config.n8n.apiKey,
    'Content-Type': 'application/json',
  },
});

export interface WorkflowUpdateResponse {
  id: string;
  name: string;
  active: boolean;
}

export const n8nService = {
  async getWorkflow(id: string) {
    const response = await n8nClient.get(`/workflows/${id}`);
    return response.data;
  },

  async updateWorkflow(id: string, workflowData: any) {
    const response = await n8nClient.put(`/workflows/${id}`, workflowData);
    return response.data;
  },

  async deactivateWorkflow(id: string): Promise<WorkflowUpdateResponse> {
    const response = await n8nClient.post(`/workflows/${id}/deactivate`);
    return response.data;
  },

  async activateWorkflow(id: string): Promise<WorkflowUpdateResponse> {
    const response = await n8nClient.post(`/workflows/${id}/activate`);
    return response.data;
  },

  async getExecution(id: string) {
    const response = await n8nClient.get(`/executions/${id}`);
    return response.data;
  },

  async triggerWorkflow(id: string) {
    const response = await n8nClient.post(`/workflows/${id}/execute`);
    return response.data;
  },

  async createWorkflow(workflowData: any) {
    const response = await n8nClient.post('/workflows', workflowData);
    return response.data;
  },

  async waitForExecution(executionId: string, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const response = await this.getExecution(executionId);
      if (response.status === 'success' || response.status === 'error' || response.status === 'crashed') {
        return response;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Timeout waiting for execution completion');
  }
};

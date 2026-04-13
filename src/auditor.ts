interface ToolCallRecord {
    tool_name: string;
    duration_ms: number;
    success: boolean;
}

interface Execution {
    execution_id: string;
    timestamp_start: string;
    timestamp_end: string;
    total_duration_ms: number;
    trigger_type: 'manual' | 'webhook' | 'scheduled';
    status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'TIMED_OUT';
    tokens: {
        prompt: number;
        completion: number;
        total: number;
        estimated_cost_usd: number;
    };
    latency_breakdown: {
        llm_ms: number;
        tool_calls_ms: number;
        overhead_ms: number;
    };
    tool_calls: ToolCallRecord[];
    errors: any[];
    error_count: number;
}

class AuditorService {
    private executions: Execution[] = [];
    private shareLinks = new Map<string, { data: Execution[], expiry: number }>();

    logExecution(exec: Execution) {
        this.executions.unshift(exec);
        if (this.executions.length > 5) {
            this.executions.pop();
        }
        console.log(`[EXECUTIVE AUDITOR] Finalized ${exec.execution_id} with status ${exec.status}`);
    }

    // Compatibility wrapper for simple events
    log(type: any, details: string) {
        console.log(`[EVENT] ${type}: ${details}`);
    }

    getExecutions() {
        return this.executions;
    }

    generateShareLink(token: string) {
        // Deep copy of current executions to freeze the state
        const snapshot = JSON.parse(JSON.stringify(this.executions));
        this.shareLinks.set(token, {
            data: snapshot,
            expiry: Date.now() + (300 * 1000) // 5 minutes
        });

        // Cleanup after 5 mins
        setTimeout(() => {
            this.shareLinks.delete(token);
        }, 300 * 1000);
    }

    getSharedData(token: string) {
        const entry = this.shareLinks.get(token);
        if (!entry || entry.expiry < Date.now()) return null;
        return entry.data;
    }

    getStats() {
        // Compatibility wrapper for original dashboard needs if any
        return {
            recentExecutions: this.executions,
            totalTokens: this.executions.reduce((acc, curr) => acc + curr.tokens.total, 0),
            successRate: this.executions.length > 0
                ? ((this.executions.filter(e => e.status === 'SUCCESS').length / this.executions.length) * 100).toFixed(1)
                : '100',
            uptime: 0 // Will be handled by session duration in dashboard
        };
    }
}

export const auditor = new AuditorService();
export type { Execution, ToolCallRecord };

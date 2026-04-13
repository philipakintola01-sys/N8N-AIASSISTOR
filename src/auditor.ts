interface AgentEvent {
    timestamp: Date;
    type: 'COMMAND' | 'NEURAL' | 'ERROR' | 'WEBHOOK';
    details: string;
    tokens?: number;
}

class AuditorService {
    private events: AgentEvent[] = [];
    private maxEvents = 100;
    private totalTokens = 0;
    private neuralSuccessCount = 0;
    private neuralFailCount = 0;

    log(type: AgentEvent['type'], details: string, tokens?: number) {
        const event: AgentEvent = {
            timestamp: new Date(),
            type,
            details,
            tokens
        };
        
        this.events.unshift(event);
        if (this.events.length > this.maxEvents) {
            this.events.pop();
        }

        if (type === 'NEURAL') {
            this.neuralSuccessCount++;
            if (tokens) this.totalTokens += tokens;
        } else if (type === 'ERROR') {
            this.neuralFailCount++;
        }
        
        console.log(`[AUDITOR] ${type}: ${details}`);
    }

    getStats() {
        return {
            totalEvents: this.events.length,
            totalTokens: this.totalTokens,
            successRate: this.neuralSuccessCount + this.neuralFailCount > 0 
                ? (this.neuralSuccessCount / (this.neuralSuccessCount + this.neuralFailCount) * 100).toFixed(1) 
                : '100',
            recentEvents: this.events.slice(0, 50)
        };
    }
}

export const auditor = new AuditorService();

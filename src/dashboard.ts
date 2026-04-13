export const getDashboardHtml = (stats: any) => {
    const stabilityRating = stats.successRate > 90 ? 'EXCELLENT' : stats.successRate > 70 ? 'STABLE' : 'CRITICAL';
    const hasQuotaBlock = stats.recentEvents.some((e: any) => e.details.includes('Limit 0') || e.details.includes('ACTION REQUIRED'));

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dave Jnr | Internal Hub</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #0d1117;
                --card: #161b22;
                --text: #c9d1d9;
                --accent: #58a6ff;
                --success: #3fb950;
                --error: #f85149;
                --warning: #d29922;
                --border: #30363d;
            }
            body { background: var(--bg); color: var(--text); font-family: 'JetBrains Mono', monospace; margin: 0; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            
            .alert-banner { 
                background: var(--error); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; 
                display: ${hasQuotaBlock ? 'block' : 'none'};
                text-align: center; font-weight: bold; border: 2px solid white; animation: pulse 2s infinite;
            }
            @keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

            .header { border-bottom: 2px solid var(--border); padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; color: var(--accent); }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
            .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-EXCELLENT { background: var(--success); color: white; }
            .status-STABLE { background: var(--warning); color: black; }
            .status-CRITICAL { background: var(--error); color: white; }

            .log-section { margin-top: 40px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
            .log-header { background: var(--border); padding: 15px 20px; font-weight: bold; display: flex; justify-content: space-between; }
            .log-list { max-height: 500px; overflow-y: auto; }
            .log-item { padding: 10px 20px; border-bottom: 1px solid var(--border); font-size: 13px; display: flex; gap: 20px; }
            .log-time { color: var(--accent); white-space: nowrap; }
            .log-type { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; height: fit-content; }
            .type-NEURAL { background: #382451; color: #d6bcfa; }
            .type-COMMAND { background: #22543d; color: #9ae6b4; }
            .type-ERROR { background: #742a2a; color: #feb2b2; }
            .log-details { flex-grow: 1; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="alert-banner">
                🚨 ACTION REQUIRED: Google AI Quota Gated (Limit 0). Enable billing in Cloud Console immediately! 🚨
            </div>

            <div class="header">
                <div class="title">💀 Dave Jnr : Internal Auditor</div>
                <div>Stability: <span class="status-badge status-${stabilityRating}">${stabilityRating}</span></div>
            </div>

            <div class="grid">
                <div class="card">
                    <div style="opacity: 0.7">Neural Success Rate</div>
                    <div class="stat-value" style="color: var(--success)">${stats.successRate}%</div>
                </div>
                <div class="card">
                    <div style="opacity: 0.7">Credit Usage (Tokens)</div>
                    <div class="stat-value" style="color: var(--accent)">${stats.totalTokens.toLocaleString()}</div>
                </div>
                <div class="card">
                    <div style="opacity: 0.7">Resilience Retries</div>
                    <div class="stat-value" style="color: var(--warning)">${stats.recentEvents.filter((e: any) => e.details.includes('Retry')).length}</div>
                </div>
            </div>

            <div class="log-section">
                <div class="log-header">
                    <span>🕵️ Activity Stream</span>
                    <span style="opacity: 0.5">Stability: ${stabilityRating} Dashboard</span>
                </div>
                <div class="log-list">
                    ${stats.recentEvents.map((e: any) => `
                        <div class="log-item">
                            <span class="log-time">${new Date(e.timestamp).toLocaleTimeString()}</span>
                            <span class="log-type type-${e.type}">${e.type}</span>
                            <span class="log-details">${e.details}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

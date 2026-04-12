export const getDashboardHtml = (stats: any) => {
    const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : '0';
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dave Jnr | Monitoring Hub</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #0d1117;
                --card: #161b22;
                --text: #c9d1d9;
                --accent: #58a6ff;
                --success: #3fb950;
                --error: #f85149;
                --border: #30363d;
            }
            body {
                background-color: var(--bg);
                color: var(--text);
                font-family: 'JetBrains Mono', monospace;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .header {
                width: 100%;
                max-width: 1000px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                border-bottom: 2px solid var(--border);
                padding-bottom: 20px;
            }
            .title { font-size: 24px; font-weight: bold; color: var(--accent); }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                width: 100%;
                max-width: 1000px;
            }
            .card {
                background: var(--card);
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                transition: transform 0.2s;
            }
            .card:hover { transform: translateY(-5px); border-color: var(--accent); }
            .stat-value { font-size: 48px; font-weight: bold; margin: 10px 0; }
            .success { color: var(--success); }
            .error { color: var(--error); }
            .label { font-size: 14px; opacity: 0.7; text-transform: uppercase; }
            
            .recent-errors {
                width: 100%;
                max-width: 1000px;
                margin-top: 40px;
                background: var(--card);
                border: 1px solid var(--border);
                border-radius: 12px;
                overflow: hidden;
            }
            .recent-errors-header {
                padding: 15px 20px;
                background: var(--border);
                font-weight: bold;
                display: flex;
                justify-content: space-between;
            }
            .error-row {
                padding: 15px 20px;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                font-size: 14px;
            }
            .error-row:last-child { border-bottom: none; }
            .badge {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                background: var(--error);
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">💀 Dave Jnr Monitoring Hub</div>
            <div class="label">v3.0.0-PRO</div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="label">Overall Success Rate</div>
                <div class="stat-value success">${successRate}%</div>
                <div class="label">Last 100 Executions</div>
            </div>
            <div class="card">
                <div class="label">Recent Failures</div>
                <div class="stat-value error">${stats.error}</div>
                <div class="label">Incident Analysis Required</div>
            </div>
            <div class="card">
                <div class="label">Active State</div>
                <div class="stat-value" style="color: var(--accent);">${stats.total}</div>
                <div class="label">Workflows Monitored</div>
            </div>
        </div>

        <div class="recent-errors">
            <div class="recent-errors-header">
                <span>🚨 Recent Critical Incidents</span>
                <span>Actions Required</span>
            </div>
            ${stats.recentErrors.length > 0 ? stats.recentErrors.map((err: any) => `
                <div class="error-row">
                    <span>Workflow ${err.workflowId} failed execution ${err.id}</span>
                    <span class="badge">RCA Pending</span>
                </div>
            `).join('') : '<div class="error-row">No active incidents. Systems clear. 💀</div>'}
        </div>

        <p style="margin-top: 50px; opacity: 0.5; font-size: 12px;">Generated by Dave Jnr AI | Master Automation Sentinel</p>
    </body>
    </html>
    `;
};

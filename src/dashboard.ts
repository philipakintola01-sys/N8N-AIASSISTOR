export const getDashboardHtml = (stats: any, shareToken?: string) => {
    const executions = stats.recentExecutions || [];
    const avgLatency = executions.length > 0 ? (executions.reduce((acc: number, e: any) => acc + e.total_duration_ms, 0) / executions.length).toFixed(0) : 0;
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dave Jnr : Executive Protocol v5.0</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            :root {
                --bg: #05070a;
                --card-bg: rgba(22, 27, 34, 0.8);
                --card-border: rgba(48, 54, 61, 0.8);
                --neon-green: #3fb950;
                --neon-blue: #58a6ff;
                --neon-red: #f85149;
                --neon-gold: #d29922;
                --text-main: #c9d1d9;
            }
            body { 
                background: var(--bg); color: var(--text-main); font-family: 'Inter', sans-serif; margin: 0; padding: 25px;
                background-image: radial-gradient(circle at 2px 2px, #161b22 1px, transparent 0);
                background-size: 40px 40px;
            }
            .container { max-width: 1400px; margin: 0 auto; }

            /* Header Protocol */
            .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; border-bottom: 1px solid var(--card-border); padding-bottom: 20px; }
            .title-group h1 { margin: 0; font-size: 28px; letter-spacing: -1px; display: flex; align-items: center; gap: 15px; }
            .share-banner { 
                background: var(--neon-gold); color: black; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px;
                display: ${shareToken ? 'flex' : 'none'}; align-items: center; gap: 15px;
            }

            /* Metrics Row */
            .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .metric-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 20px; backdrop-filter: blur(10px); }
            .metric-label { font-size: 11px; font-weight: bold; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }
            .metric-value { font-size: 32px; font-family: 'JetBrains Mono', monospace; font-weight: bold; margin-top: 10px; }

            /* Trend Charts */
            .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .chart-container { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 20px; height: 300px; }

            /* Execution Protocol List */
            .exec-list { display: flex; flex-direction: column; gap: 15px; }
            .exec-card { 
                background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; 
                overflow: hidden; transition: all 0.3s ease;
            }
            .exec-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
            .exec-identity { display: flex; gap: 20px; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
            .status-tag { padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; }
            .status-SUCCESS { background: rgba(63, 185, 80, 0.1); color: var(--neon-green); border: 1px solid var(--neon-green); }
            .status-FAILED { background: rgba(248, 81, 73, 0.1); color: var(--neon-red); border: 1px solid var(--neon-red); }

            .exec-body { display: none; padding: 20px; border-top: 1px solid var(--card-border); background: rgba(0,0,0,0.2); }
            .exec-card.open .exec-body { display: block; }

            .details-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 30px; }
            .raw-log-box { background: #000; border-radius: 8px; padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #8b949e; overflow-x: auto; }
            
            .latency-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted var(--card-border); font-size: 12px; }
            .latency-bar { height: 4px; background: var(--neon-blue); border-radius: 2px; margin-top: 5px; }

            #countdown { font-family: 'JetBrains Mono', monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="share-banner">
                <span>⚠️ EPHEMERAL SHARING ACTIVE</span>
                <span id="countdown">Link expires in 05:00</span>
                <span>ID: ${shareToken || 'INTERNAL'}</span>
            </div>

            <header class="header">
                <div class="title-group">
                    <h1>💀 DAVE JNR <span style="opacity:0.3">/</span> EXECUTIVE PROTOCOL</h1>
                    <div style="font-size: 12px; opacity: 0.5; margin-top: 5px;">STRATEGIC NEURAL OBSERVABILITY // ROLLING 5-EXECUTION WINDOW</div>
                </div>
                <div style="text-align: right">
                    <div class="metric-label">System State</div>
                    <div style="color: var(--neon-green); font-weight: bold; font-size: 14px;">ACTIVE_SENTINEL_PRO</div>
                </div>
            </header>

            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Avg Latency (Rolling 5)</div>
                    <div class="metric-value">${avgLatency}ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Neural Resource Cost</div>
                    <div class="metric-value" style="color: var(--neon-blue)">$${executions.length > 0 ? executions[0].tokens.estimated_cost_usd.toFixed(4) : '0.0000'}</div>
                    <div class="metric-label" style="margin-top:5px">Last Session Est.</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Error Rate (x/5)</div>
                    <div class="metric-value" style="color: ${executions.filter((e: any) => e.status === 'FAILED').length > 0 ? 'var(--neon-red)' : 'var(--neon-green)'}">
                        ${executions.filter((e:any) => e.status === 'FAILED').length}/5
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-container"><canvas id="latencyChart"></canvas></div>
                <div class="chart-container"><canvas id="costChart"></canvas></div>
            </div>

            <div class="exec-list">
                <div class="metric-label" style="margin-bottom: 10px;">Execution Identity Trace</div>
                ${executions.map((e: any, idx: number) => `
                    <div class="exec-card" id="exec-${idx}">
                        <div class="exec-header" onclick="this.parentElement.classList.toggle('open')">
                            <div class="exec-identity">
                                <span style="opacity:0.4">#${e.execution_id}</span>
                                <span class="status-tag status-${e.status}">${e.status}</span>
                                <span>${e.trigger_type.toUpperCase()}</span>
                            </div>
                            <div style="font-size: 12px; opacity: 0.6;">
                                ${new Date(e.timestamp_start).toLocaleTimeString()} · ${e.total_duration_ms.toFixed(0)}ms
                            </div>
                        </div>
                        <div class="exec-body">
                            <div class="details-grid">
                                <div>
                                    <div class="metric-label">Latency Breakdown</div>
                                    <div class="latency-item"><span>LLM Duration</span><span>${e.latency_breakdown.llm_ms.toFixed(0)}ms</span></div>
                                    <div class="latency-bar" style="width: ${(e.latency_breakdown.llm_ms / e.total_duration_ms) * 100}%"></div>
                                    <div class="latency-item"><span>Tool Processing</span><span>${e.latency_breakdown.tool_calls_ms.toFixed(0)}ms</span></div>
                                    <div class="latency-bar" style="width: ${(e.latency_breakdown.tool_calls_ms / e.total_duration_ms) * 100}%; background: var(--neon-green)"></div>
                                    <div class="latency-item"><span>System Overhead</span><span>${e.latency_breakdown.overhead_ms.toFixed(0)}ms</span></div>
                                    
                                    <div class="metric-label" style="margin-top: 20px;">Token Protocol</div>
                                    <div class="latency-item"><span>Prompt Tokens</span><span>${e.tokens.prompt}</span></div>
                                    <div class="latency-item"><span>Completion</span><span>${e.tokens.completion}</span></div>
                                    <div style="font-size: 20px; font-weight: bold; margin-top: 10px;">${e.tokens.total} <span style="font-size:12px; opacity:0.5">TOTAL</span></div>
                                </div>
                                <div>
                                    <div class="metric-label">The Raw Error Log (Identity Trace)</div>
                                    <div class="raw-log-box">
                                        <pre>${JSON.stringify(e, null, 2)}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <script>
            // Charts Implementation
            const execData = ${JSON.stringify(executions.reverse())};
            
            new Chart(document.getElementById('latencyChart'), {
                type: 'line',
                data: {
                    labels: execData.map(e => e.execution_id.split('_')[1]),
                    datasets: [{
                        label: 'Total Latency (ms)',
                        data: execData.map(e => e.total_duration_ms),
                        borderColor: '#58a6ff',
                        backgroundColor: 'rgba(88, 166, 255, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#30363d' } }, x: { grid: { display: false } } } }
            });

            new Chart(document.getElementById('costChart'), {
                type: 'bar',
                data: {
                    labels: execData.map(e => e.execution_id.split('_')[1]),
                    datasets: [{
                        label: 'Token Volume',
                        data: execData.map(e => e.tokens.total),
                        backgroundColor: '#3fb950',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#303030' } } } }
            });

            // Timer Logic
            if (${!!shareToken}) {
                let timeLeft = 300;
                const timer = setInterval(() => {
                    timeLeft--;
                    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                    const secs = (timeLeft % 60).toString().padStart(2, '0');
                    document.getElementById('countdown').innerText = 'Link expires in ' + mins + ':' + secs;
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        window.location.reload();
                    }
                }, 1000);
            }
        </script>
    </body>
    </html>
    `;
};

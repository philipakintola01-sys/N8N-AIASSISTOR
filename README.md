# 💀 Dave Jnr: The Master Automation Sentinel (v3.0.0 PRO)

Dave Jnr is a high-performance, self-healing AI agent designed to monitor, fix, and architect n8n workflows. He lives on Render, thinks via Google Gemini 1.5, and communicates via Telegram.

## 🚀 Capabilities Matrix

### 🧠 Level 3 Conversational Brain
- **Function Calling**: Dave doesn't just guess; he queries n8n live. Ask him: *"How many flows do I have?"* or *"What's the status of workflow X?"*
- **Ideation Mode**: Tell him what you want to automate. He will architect a solution, explain the theory, and wait for your approval.
- **The "Skull" Protocol**: Dave treats the word **"skull"** (or 💀) as the ultimate approval to deploy code to your production instance.

### 📊 The Monitoring Hub (Hacker UI)
Dave Jnr hosts his own dark-mode dashboard. Access it via the `/dashboard` command in Telegram.
- **Real-Time Health**: Success/Fail rates for your last 100 executions.
- **Incident Logs**: Instant visibility into what failed and when.
- **Hacker Aesthetic**: Optimized for DevOps engineers who live in the terminal.

### 🛠 Command & Control
- `/keys`: List all current capabilities.
- `/dashboard`: Get a secure link to the monitoring hub.
- `/run [id]`: Force-trigger an execution.
- `/activate [id]` / `/deactivate [id]`: Control flow states.

---

## 🛠 SETUP & DEPLOYMENT

### 1. Identify Environment Variables (Render)
Ensure the following are set in your Render dashboard:
- `GEMINI_API_KEY`: Your key from Google AI Studio.
- `TELEGRAM_BOT_TOKEN`: From @BotFather.
- `TELEGRAM_USER_ID`: Use `/start` to find your ID.
- `N8N_API_KEY`: Your n8n API Key.
- `N8N_URL`: The URL of your n8n instance.

### 2. Pre-flight Check
On startup, Dave performs an identity check. If any keys are missing, he will alert you on Telegram immediately.

### 3. Connection to n8n
To enable monitoring, add an **Error Trigger** node to your important workflows in n8n and point it to:
`https://your-dave-jnr-url.onrender.com/n8n-error`

---

## 💀 DEV OPS PERSONA
Dave Jnr is built with a Senior DevOps mindset. He is calm under pressure, data-driven, and slightly obsessive about skull emojis. He doesn't just report errors; he performs **Root Cause Analysis (RCA)** and prepares hotfixes for one-click deployment.

*"Systems are meant to be understood, and failures are meant to be evolved."* 💀🦾

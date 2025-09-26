# Heimdall Workflow Engine

An intelligent workflow and quality gatekeeper for VSCode, designed for TRAE/Freya projects. Analyzes Python code with FDS (Freya Detection System) for emotion detection (VADER/TextBlob), auto-fixes with AI (OpenRouter/Grok), and runs migrations under 200ms latency.

## Features
- **FDS Analysis:** Run `Heimdall: Analyze with FDS` to generate `analysis.json` with requirements, confidence, and emotion insights from files like `advanced.txt`.
- **AI Code Fix:** Select code → `Heimdall: AI Fix Code` → Applies emotion-aware fixes (e.g., integrate sentiment analysis).
- **Freya Workflow:** `Heimdall: Run Freya Workflow` chains analysis, fixes, and tasks for seamless migration.
- **Hello World:** Test command for quick verify.

## Requirements
- Python 3.10+ with conda env "heimdall" (includes `fds_analyst.py` for VADER/TextBlob).
- OpenRouter API key (for AI features: Settings → "heimdall.openRouterKey").

## Extension Settings
- `heimdall.openRouterKey`: Your sk-or-v1-... API key for AI.
- `heimdall.fdsPrompt`: Custom prompt template (default: "Migriere with emotion-detect for Freya <200ms").
- `heimdall.agentBehavior`: JSON config for mode (e.g., "freya-migrate"), maxLatency, emotions.

## Installation
Install via VSIX. Copy `fds_analyst.py` to your workspace. Reload after install.

## Release Notes
### 1.0.0
Initial release with FDS integration and AI fixes for Freya workflows.
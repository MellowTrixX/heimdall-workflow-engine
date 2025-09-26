// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as http from 'http';  // Für Typen (IncomingMessage, etc.)
import * as path from 'path';  // Fix für Typen
import * as https from 'https';  // Fix: Direkt import für HTTPS-Request
import * as fs from 'fs';  // Fix: Direkt import für FS (readFileSync etc.)

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('Heimdall Workflow Engine active!');

    // Bestehender Hello World
    const helloDisposable = vscode.commands.registerCommand('heimdall-workflow-engine.helloWorld', () => {
        vscode.window.showInformationMessage('Hello from Heimdall!');
    });

    // Command: Run Full Workflow
    const runWorkflowDisposable = vscode.commands.registerCommand('heimdall-workflow-engine.runWorkflow', async () => {
        const tasks = await vscode.tasks.fetchTasks();
        const workflowTask = tasks.find(t => t.name === 'freya-full-workflow');
        if (workflowTask) {
            vscode.tasks.executeTask(workflowTask);
            vscode.window.showInformationMessage('Heimdall: Starting Freya Pipeline (Migrate → Fix → Test)');
        } else {
            vscode.window.showErrorMessage('Task "freya-full-workflow" not found – Check .vscode/tasks.json');
        }
    });

    // Command: AI-Fix (Fixed Typen für https)
    const aiFixDisposable = vscode.commands.registerCommand('heimdall-workflow-engine.aiFix', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Open a file and select code to fix first!');
            return;
        }

        const filePath = editor.document.fileName;
        const selection = editor.selection.isEmpty ? editor.document.getText() : editor.document.getText(editor.selection);
        const prompt = `Fix this code in ${filePath} for Freya (e.g. add detect_emotion hook, resolve imports with VADER/Whisper, ensure <200ms): \n\n${selection}`;

        // OpenRouter API-Key aus Settings
        const apiKey = vscode.workspace.getConfiguration('heimdall').get<string>('openrouterKey') || 'YOUR_OPENROUTER_API_KEY';
        if (apiKey === 'YOUR_OPENROUTER_API_KEY') {
            vscode.window.showErrorMessage('Set "heimdall.openrouterKey" in Settings (from openrouter.ai)!');
            return;
        }

        const model = 'anthropic/claude-3.5-sonnet';
        const url = 'https://openrouter.ai/api/v1/chat/completions';

        // HTTPS-Request (Fixed: Verwende import https, Typen sauber)
        const postData = JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.2
        });

        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res: http.IncomingMessage) => {  // Typ res: IncomingMessage
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk: any) => {  // Typ any für Buffer/String (utf8 konvertiert)
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.choices && response.choices[0]) {
                        const fixedCode = response.choices[0].message.content.trim();
                        editor.edit(editBuilder => {
                            const range = editor.selection.isEmpty ? new vscode.Range(0, 0, editor.document.lineCount, 0) : editor.selection;
                            editBuilder.replace(range, fixedCode);
                        });
                        vscode.window.showInformationMessage(`AI-Fix applied! (Model: ${model}, Tokens: ~${response.usage?.total_tokens || 'N/A'})`);
                    } else {
                        vscode.window.showErrorMessage('No response from OpenRouter – Check API Key/Limits');
                    }
                } catch (e) {
                    const error = e as Error;  // Cast to Error
                    vscode.window.showErrorMessage(`JSON Parse Error: ${error.message}`);
                }
            });
        });

        req.on('error', (err: Error) => {  // Typ err: Error
            vscode.window.showErrorMessage(`HTTPS Error: ${err.message} (Check internet/API Key)`);
        });
        req.write(postData);
        req.end();

        vscode.window.showInformationMessage('Requesting AI-Fix from OpenRouter...');
    });

    // Command: Analyze Prompt with FDS
    const analyzeDisposable = vscode.commands.registerCommand('heimdall-workflow-engine.analyzePrompt', async () => {
        const prompt = await vscode.window.showInputBox({
            prompt: 'Enter requirements/prompt for FDS Analysis (e.g. TRAE-Follow-Up)'
        });
        if (prompt) {
            const terminal = vscode.window.createTerminal({ 
                name: 'FDS Analyst', 
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath 
            });
            const escapedPrompt = prompt.replace(/"/g, '\\"');  // Escape
            terminal.sendText(`python fds_analyst.py -i "${escapedPrompt}" -o json > analysis.json`);
            terminal.show();
            // Zeige Result nach kurzer Wartezeit (rough)
            setTimeout(() => {
                try {
                    const result = fs.readFileSync('analysis.json', 'utf8');
                    const parsed = JSON.parse(result);
                    vscode.window.showInformationMessage(`Analysis done! Confidence: ${parsed.confidence || 'N/A'}`);
                } catch (readErr) {
                    vscode.window.showWarningMessage('Analysis running... Check analysis.json');
                }
            }, 2000);
        }
    });

    // Push alle
    context.subscriptions.push(helloDisposable, runWorkflowDisposable, aiFixDisposable, analyzeDisposable);
}

export function deactivate() {}
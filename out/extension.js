"use strict";
// File: src/extension.ts - Heimdall Workflow Engine v3.2 (Final & Cleaned)
// Authors: Patrick L. & Freya AI
// Description: Der Wächter der Brücke zwischen Plan und Realität. Robuste, asynchrone und zustands-sichere Implementierung.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
// ================================================================================================
// HAUPTKLASSE: HEIMDALL WORKFLOW ENGINE
// ================================================================================================
class HeimdallWorkflowEngine {
    constructor(workspaceRoot, context) {
        this.taskFiles = new Map();
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'heimdall.showDashboard';
        context.subscriptions.push(this.statusBarItem);
        this.rules = this.loadRules();
        this.ensureHeimdallStructure();
    }
    static async create(context) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showInformationMessage('🛡️ Heimdall: Bitte öffnen Sie einen Ordner, um zu starten.');
            return undefined;
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const engine = new HeimdallWorkflowEngine(workspaceRoot, context);
        await engine.initialize();
        return engine;
    }
    async initialize() {
        await this.scanWorkspaceForTasks();
        this.statusBarItem.show();
    }
    dispose() {
        this.webviewPanel?.dispose();
        this.statusBarItem.dispose();
    }
    hasActiveWebview() {
        return !!this.webviewPanel;
    }
    async explainCodeByAI() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Kein aktiver Editor gefunden. Bitte öffnen Sie eine Datei.');
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (selection.isEmpty || !selectedText.trim()) {
            vscode.window.showInformationMessage('Kein Code markiert. Bitte markieren Sie den zu analysierenden Code.');
            return;
        }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Heimdall KI kontaktiert Ollama...",
            cancellable: false
        }, async (progress) => {
            try {
                const prompt = `Du bist ein erfahrener Software-Architekt. Analysiere den folgenden Code-Schnipsel. 
                Erkläre klar und präzise:
                1. Was ist das Hauptziel dieses Codes?
                2. Wie erreicht der Code dieses Ziel (Schritt-für-Schritt)?
                3. Gibt es offensichtliche Risiken oder Best-Practice-Verletzungen?

                Code:
                \`\`\`
                ${selectedText}
                \`\`\`
                `;
                const response = await axios_1.default.post('http://localhost:11434/api/generate', {
                    model: "llama3.1:8b-instruct-q8_0",
                    prompt: prompt,
                    stream: false
                });
                const aiResponse = response.data.response;
                const doc = await vscode.workspace.openTextDocument({ content: aiResponse, language: 'markdown' });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            }
            catch (error) {
                vscode.window.showErrorMessage('Kommunikation mit Ollama fehlgeschlagen. Ist der Ollama-Server gestartet und das Modell "llama3.1:8b-instruct-q8_0" installiert?');
                console.error('Ollama API Error:', error);
            }
        });
    }
    ensureHeimdallStructure() {
        const heimdallDir = path.join(this.workspaceRoot, '.heimdall');
        try {
            if (!fs.existsSync(heimdallDir)) {
                fs.mkdirSync(heimdallDir, { recursive: true });
            }
            const rulesPath = path.join(heimdallDir, 'rules.json');
            if (!fs.existsSync(rulesPath)) {
                fs.writeFileSync(rulesPath, JSON.stringify(this.getDefaultRules(), null, 2), 'utf-8');
            }
            const directivesPath = path.join(heimdallDir, 'core_directives.md');
            if (!fs.existsSync(directivesPath)) {
                fs.writeFileSync(directivesPath, this.getDefaultCoreDirectives(), 'utf-8');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Heimdall: Fehler beim Erstellen der Konfigurationsstruktur: ${error}`);
        }
    }
    loadRules() {
        const rulesPath = path.join(this.workspaceRoot, '.heimdall', 'rules.json');
        const defaultRules = this.getDefaultRules();
        try {
            if (fs.existsSync(rulesPath)) {
                const content = fs.readFileSync(rulesPath, 'utf-8');
                const userRules = JSON.parse(content);
                return {
                    project_rules: { ...defaultRules.project_rules, ...userRules.project_rules },
                    agent_rules: { ...defaultRules.agent_rules, ...userRules.agent_rules },
                    user_rules: { ...defaultRules.user_rules, ...userRules.user_rules },
                    overall_rules: { ...defaultRules.overall_rules, ...userRules.overall_rules },
                };
            }
        }
        catch (error) {
            vscode.window.showWarningMessage('Heimdall: Fehler beim Laden der rules.json. Verwende Standardwerte.');
        }
        return defaultRules;
    }
    getDefaultRules() {
        return { project_rules: { require_docs_for_prod: true, require_tests_for_prod: true }, agent_rules: { default_persona: "Du bist ein Senior-Entwickler, spezialisiert auf sauberen, testbaren Code.", forbidden_actions: ["Zugriff auf /etc/passwd", "Netzwerk-Anfragen an nicht-vertrauenswürdige Domains"] }, user_rules: { default_commit_prefix: "feat" }, overall_rules: { core_directives_path: ".heimdall/core_directives.md" } };
    }
    getDefaultCoreDirectives() {
        return `# Heimdall Core Directives...`;
    }
    async scanWorkspaceForTasks() {
        this.taskFiles.clear();
        const mdFiles = await this.findMarkdownFiles(this.workspaceRoot);
        for (const file of mdFiles) {
            const tasks = await this.parseTasksFromFile(file);
            if (tasks.length > 0) {
                this.taskFiles.set(file, tasks);
            }
        }
        const totalTasks = this.getAllTasks().length;
        this.updateStatusBar();
        vscode.window.setStatusBarMessage(`🛡️ Heimdall: ${totalTasks} Tasks im Workspace gefunden.`, 5000);
        if (this.webviewPanel) {
            this.updateWebviewData();
        }
    }
    async findMarkdownFiles(dir) {
        let files = [];
        try {
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));
            for (const [name, type] of entries) {
                if (name.startsWith('.') || name === 'node_modules') {
                    continue;
                }
                const fullPath = path.join(dir, name);
                if (type === vscode.FileType.Directory) {
                    files = files.concat(await this.findMarkdownFiles(fullPath));
                }
                else if (type === vscode.FileType.File && name.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        }
        catch (error) { }
        return files;
    }
    async parseTasksFromFile(filePath) {
        try {
            const fileUri = vscode.Uri.file(filePath);
            const contentBytes = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(contentBytes).toString('utf-8');
            const lines = content.split(/\r?\n/);
            const tasks = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const taskMatch = line.match(/^\s*-\s*\[([xX ~!?])\]\s*(.*)$/);
                if (taskMatch) {
                    const [, statusChar, taskText] = taskMatch;
                    const relativePath = path.relative(this.workspaceRoot, filePath);
                    const task = {
                        id: `${relativePath}:${i}`,
                        line: i,
                        rawText: line,
                        status: this.parseTaskStatus(statusChar),
                        classification: this.parseTaskClassification(taskText),
                        title: this.cleanTaskTitle(taskText),
                        file: relativePath
                    };
                    tasks.push(task);
                }
            }
            return tasks;
        }
        catch (error) {
            console.error(`Heimdall: Fehler beim Parsen der Datei ${filePath}`, error);
            return [];
        }
    }
    async addNewTask() {
        const taskTitle = await vscode.window.showInputBox({ prompt: "Geben Sie den Titel des neuen Tasks ein", placeHolder: "z.B. Benutzer-Authentifizierung implementieren" });
        if (!taskTitle) {
            return;
        }
        const taskFilePath = path.join(this.workspaceRoot, 'TASKS.md');
        const taskFileUri = vscode.Uri.file(taskFilePath);
        const newTaskLine = `- [ ] [NICHT GESTARTET] ${taskTitle}\n`;
        try {
            let content = '';
            if (fs.existsSync(taskFilePath)) {
                const contentBytes = await vscode.workspace.fs.readFile(taskFileUri);
                content = Buffer.from(contentBytes).toString('utf-8');
            }
            content += newTaskLine;
            await vscode.workspace.fs.writeFile(taskFileUri, Buffer.from(content, 'utf-8'));
            vscode.window.showInformationMessage(`✅ Task hinzugefügt in TASKS.md`);
            await this.scanWorkspaceForTasks();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Fehler beim Hinzufügen des Tasks: ${error}`);
        }
    }
    async editTaskTitle(taskId) {
        const task = this.findTaskById(taskId);
        if (!task) {
            vscode.window.showErrorMessage("Task nicht gefunden.");
            return;
        }
        const newTitle = await vscode.window.showInputBox({ prompt: "Neuen Titel für den Task eingeben", value: task.title });
        if (!newTitle || newTitle === task.title) {
            return;
        }
        const fileUri = vscode.Uri.file(path.join(this.workspaceRoot, task.file));
        try {
            const contentBytes = await vscode.workspace.fs.readFile(fileUri);
            const lines = Buffer.from(contentBytes).toString('utf-8').split(/\r?\n/);
            if (task.line >= lines.length)
                throw new Error("Zeilennummer ungültig.");
            const line = lines[task.line];
            const checkboxMatch = line.match(/^(\s*-\s*\[[^\]]+\]\s*)/);
            if (!checkboxMatch)
                throw new Error("Task-Format nicht erkannt.");
            const classificationTag = task.classification !== 'UNKLASSIFIZIERT' ? `[${task.classification}] ` : '';
            const newLine = `${checkboxMatch[0]}${classificationTag}${newTitle}`;
            lines[task.line] = newLine;
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(lines.join('\n'), 'utf-8'));
            await this.scanWorkspaceForTasks();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Fehler beim Bearbeiten des Tasks: ${error}`);
        }
    }
    async classifyTask() {
        const allTasks = this.getAllTasks();
        if (allTasks.length === 0) {
            vscode.window.showInformationMessage('🛡️ Keine Tasks gefunden.');
            return;
        }
        const taskItems = allTasks.map(task => ({ label: `📝 ${task.title}`, description: `${task.classification} | ${task.file}`, detail: `Zeile ${task.line + 1}`, task: task }));
        const selectedItem = await vscode.window.showQuickPick(taskItems, { placeHolder: '🎯 Welchen Task möchten Sie klassifizieren?' });
        if (!selectedItem) {
            return;
        }
        const classifications = [
            { label: '🕒 [NICHT GESTARTET]', description: 'Geplant, aber die Arbeit hat noch nicht begonnen.', target: 'NICHT_GESTARTET' },
            { label: '🧪 [PROTOTYP]', description: 'In aktiver Entwicklung oder im Funktionstest.', target: 'PROTOTYP' },
            { label: '✅ [ABGESCHLOSSEN]', description: 'Funktionalität ist fertig und produktionsreif.', target: 'ABGESCHLOSSEN' },
            { label: '📖 [ABGESCHLOSSEN_DOKUMENTIERT]', description: 'Produktionsreif UND vollständig dokumentiert.', target: 'ABGESCHLOSSEN_DOKUMENTIERT' }
        ];
        const selectedClassification = await vscode.window.showQuickPick(classifications, { placeHolder: `🏷️ Neue Klassifizierung für: ${selectedItem.task.title}` });
        if (!selectedClassification) {
            return;
        }
        await this.updateTaskClassification(selectedItem.task, selectedClassification.target);
    }
    async updateTaskClassification(task, newClassification) {
        const fileUri = vscode.Uri.file(path.join(this.workspaceRoot, task.file));
        try {
            const contentBytes = await vscode.workspace.fs.readFile(fileUri);
            const lines = Buffer.from(contentBytes).toString('utf-8').split(/\r?\n/);
            if (task.line >= lines.length) {
                throw new Error("Zeilennummer ist außerhalb des gültigen Bereichs.");
            }
            const line = lines[task.line];
            const textWithoutClassification = this.cleanTaskTitle(line);
            const checkboxMatch = line.match(/^(\s*- \[[^\]]\]\s*)/);
            if (!checkboxMatch) {
                throw new Error("Keine gültige Task-Checkbox gefunden.");
            }
            const prefix = checkboxMatch[0];
            const newLine = `${prefix}[${newClassification}] ${textWithoutClassification}`;
            lines[task.line] = newLine;
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(lines.join('\n'), 'utf-8'));
            await this.scanWorkspaceForTasks();
            vscode.window.setStatusBarMessage(`🛡️ Task zu [${newClassification}] klassifiziert`, 3000);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Fehler beim Aktualisieren des Tasks: ${message}`);
        }
    }
    showDashboard() {
        const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.One;
        if (this.webviewPanel) {
            this.webviewPanel.reveal(column);
            this.updateWebviewData();
            return;
        }
        this.webviewPanel = vscode.window.createWebviewPanel('heimdallDashboard', '🛡️ Heimdall Dashboard', column, { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')] });
        this.webviewPanel.onDidDispose(() => { this.webviewPanel = undefined; }, null, this.context.subscriptions);
        this.webviewPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'heimdall.refresh':
                    await this.scanWorkspaceForTasks();
                    return;
                case 'heimdall.addTask':
                    await this.addNewTask();
                    return;
                case 'heimdall.editTask':
                    await this.editTaskTitle(message.taskId);
                    return;
                case 'heimdall.openFile':
                    const filePath = path.join(this.workspaceRoot, message.file);
                    const openPath = vscode.Uri.file(filePath);
                    vscode.workspace.openTextDocument(openPath).then(doc => {
                        vscode.window.showTextDocument(doc).then(editor => {
                            const pos = new vscode.Position(message.line, 0);
                            editor.selection = new vscode.Selection(pos, pos);
                            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
                        });
                    });
                    return;
            }
        }, undefined, this.context.subscriptions);
        this.webviewPanel.webview.html = this.getDashboardHtml(this.webviewPanel.webview);
        this.updateWebviewData();
    }
    updateWebviewData() {
        if (!this.webviewPanel) {
            return;
        }
        const allTasks = this.getAllTasks();
        const debt = this.calculateIntegrationDebt();
        this.webviewPanel.webview.postMessage({ command: 'update', tasks: allTasks, debt: debt });
    }
    getDashboardHtml(webview) {
        const nonce = this.getNonce();
        const cspSource = webview.cspSource;
        return `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Heimdall Dashboard</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
                .header { text-align: center; margin-bottom: 20px; }
                .actions { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
                button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border); padding: 8px 15px; border-radius: 4px; cursor: pointer; }
                button:hover { background-color: var(--vscode-button-hoverBackground); }
                .debt-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                .debt-item { text-align: center; padding: 15px; background: var(--vscode-sideBar-background); border-radius: 8px; }
                .debt-number { font-size: 2em; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--vscode-panel-border); }
                th { background: var(--vscode-sideBar-background); font-weight: bold; }
                tbody tr { cursor: pointer; }
                tbody tr:hover { background: var(--vscode-list-hoverBackground); }
                .icon-cell { font-size: 1.2em; text-align: center; }
                .progress-bar { display: flex; width: 100%; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0 20px 0; }
                .welcome-view { text-align: center; padding-top: 50px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🛡️ Heimdall Workflow Engine</h1>
                <p><em>Der Wächter der Brücke zwischen Plan und Realität</em></p>
            </div>
    
            <div class="actions">
                <button id="add-task-btn">➕ Task hinzufügen</button>
                <button id="refresh-btn">🔄 Aktualisieren</button>
            </div>

            <div id="dashboard-content"></div>

            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                const dashboardContent = document.getElementById('dashboard-content');

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'update') {
                        updateDashboard(message.tasks, message.debt);
                    }
                });

                document.getElementById('add-task-btn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'heimdall.addTask' });
                });

                document.getElementById('refresh-btn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'heimdall.refresh' });
                });

                function updateDashboard(tasks, debt) {
                    if (tasks.length === 0) {
                        dashboardContent.innerHTML = '<div class="welcome-view"><p>Keine Tasks gefunden. Fügen Sie einen neuen Task hinzu oder erstellen Sie eine .md-Datei.</p></div>';
                        return;
                    }

                    const taskRows = tasks.map(task => \`
                        <tr data-task-id="\${task.id}" data-file="\${task.file}" data-line="\${task.line}">
                            <td class="icon-cell">\${getStatusIcon(task.status)}</td>
                            <td class="icon-cell">\${getClassificationIcon(task.classification)}</td>
                            <td class="task-title">\${escapeHtml(task.title)}</td>
                            <td>\${escapeHtml(task.file)}</td>
                            <td>\${task.line + 1}</td>
                        </tr>
                    \`).join('');

                    const nichtGestartetPercent = debt.totalTasks > 0 ? (debt.nichtGestartet / debt.totalTasks) * 100 : 0;
                    const prototypenPercent = debt.totalTasks > 0 ? (debt.prototypen / debt.totalTasks) * 100 : 0;
                    const abgeschlossenPercent = debt.totalTasks > 0 ? (debt.abgeschlossen / debt.totalTasks) * 100 : 0;
                    const abgeschlossenDokumentiertPercent = debt.totalTasks > 0 ? (debt.abgeschlossenDokumentiert / debt.totalTasks) * 100 : 0;

                    dashboardContent.innerHTML = \`
                        <div class="debt-summary">
                            <div class="debt-item"><div class="debt-number">\${debt.nichtGestartet}</div><div>🕒 Nicht Gestartet</div></div>
                            <div class="debt-item"><div class="debt-number">\${debt.prototypen}</div><div>🧪 Prototypen</div></div>
                            <div class="debt-item"><div class="debt-number">\${debt.abgeschlossen}</div><div>✅ Abgeschlossen</div></div>
                            <div class="debt-item"><div class="debt-number">\${debt.abgeschlossenDokumentiert}</div><div>📖 Dokumentiert</div></div>
                        </div>
                        <div class="progress-bar" title="Verteilung der Tasks">
                            <div style="width: \${nichtGestartetPercent}%; background-color: var(--vscode-terminal-ansiBrightBlack);" title="Nicht Gestartet: \${debt.nichtGestartet}"></div>
                            <div style="width: \${prototypenPercent}%; background-color: var(--vscode-terminal-ansiRed);" title="Prototypen: \${debt.prototypen}"></div>
                            <div style="width: \${abgeschlossenPercent}%; background-color: var(--vscode-terminal-ansiYellow);" title="Abgeschlossen: \${debt.abgeschlossen}"></div>
                            <div style="width: \${abgeschlossenDokumentiertPercent}%; background-color: var(--vscode-terminal-ansiGreen);" title="Dokumentiert: \${debt.abgeschlossenDokumentiert}"></div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th class="icon-cell">Status</th><th class="icon-cell">Klass.</th><th>Task</th><th>Datei</th><th>Zeile</th>
                                </tr>
                            </thead>
                            <tbody>
                                \${taskRows}
                            </tbody>
                        </table>
                    \`;
            
                    document.querySelectorAll('tbody tr').forEach(row => {
                        const titleCell = row.querySelector('.task-title');
                
                        titleCell.addEventListener('click', (e) => {
                            e.stopPropagation();
                            vscode.postMessage({ command: 'heimdall.editTask', taskId: row.dataset.taskId });
                        });
                
                        row.addEventListener('click', () => {
                            vscode.postMessage({ command: 'heimdall.openFile', file: row.dataset.file, line: parseInt(row.dataset.line, 10) });
                        });
                    });
                }

                function getStatusIcon(status) {
                    switch (status) { case 'checked': return '✅'; case 'cancelled': return '❌'; case 'important': return '❗'; case 'question': return '❓'; default: return '📋'; }
                }

                function getClassificationIcon(classification) {
                    switch (classification) {
                        case 'NICHT_GESTARTET':          return '🕒';
                        case 'PROTOTYP':                 return '🧪';
                        case 'ABGESCHLOSSEN':            return '✅';
                        case 'ABGESCHLOSSEN_DOKUMENTIERT': return '📖';
                        default:                         return '❓';
                    }
                }

                function escapeHtml(unsafe) {
                    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
                }
            </script>
        </body>
        </html>
        `;
    }
    findTaskById(taskId) {
        return this.getAllTasks().find(t => t.id === taskId);
    }
    calculateIntegrationDebt() {
        const allTasks = this.getAllTasks();
        const total = allTasks.length;
        if (total === 0) {
            return { totalTasks: 0, nichtGestartet: 0, prototypen: 0, abgeschlossen: 0, abgeschlossenDokumentiert: 0, unclassified: 0, debtPercentage: 0 };
        }
        const nichtGestartet = allTasks.filter(t => t.classification === 'NICHT_GESTARTET').length;
        const prototypen = allTasks.filter(t => t.classification === 'PROTOTYP').length;
        const abgeschlossen = allTasks.filter(t => t.classification === 'ABGESCHLOSSEN').length;
        const abgeschlossenDokumentiert = allTasks.filter(t => t.classification === 'ABGESCHLOSSEN_DOKUMENTIERT').length;
        const unclassified = allTasks.filter(t => t.classification === 'UNKLASSIFIZIERT').length;
        const nonProductionTasks = nichtGestartet + prototypen + abgeschlossen + unclassified;
        const debtPercentage = total > 0 ? Math.round((nonProductionTasks / total) * 100) : 0;
        return { totalTasks: total, nichtGestartet, prototypen, abgeschlossen, abgeschlossenDokumentiert, unclassified, debtPercentage };
    }
    cleanTaskTitle(text) {
        const cleanedText = text.replace(/\[(NICHT GESTARTET|NICHT_GESTARTET|PROTOTYP|ABGESCHLOSSEN_DOKUMENTIERT|ABGESCHLOSSEN|UNKLASSIFIZIERT)\]\s*/ig, '').trim();
        if (cleanedText.includes('|')) {
            return cleanedText.split('|')[0].trim();
        }
        return cleanedText;
    }
    parseTaskStatus(char) {
        switch (char.toLowerCase()) {
            case 'x': return 'checked';
            case '~': return 'cancelled';
            case '!': return 'important';
            case '?': return 'question';
            default: return 'unchecked';
        }
    }
    parseTaskClassification(text) {
        const upperText = text.toUpperCase();
        if (upperText.includes('[NICHT GESTARTET]')) {
            return 'NICHT_GESTARTET';
        }
        if (upperText.includes('[PROTOTYP]')) {
            return 'PROTOTYP';
        }
        if (upperText.includes('[ABGESCHLOSSEN_DOKUMENTIERT]')) {
            return 'ABGESCHLOSSEN_DOKUMENTIERT';
        }
        if (upperText.includes('[ABGESCHLOSSEN]')) {
            return 'ABGESCHLOSSEN';
        }
        return 'UNKLASSIFIZIERT';
    }
    getAllTasks() {
        return Array.from(this.taskFiles.values()).flat();
    }
    updateStatusBar() {
        const debt = this.calculateIntegrationDebt();
        const totalDocumented = debt.abgeschlossenDokumentiert;
        this.statusBarItem.text = `🛡️ Heimdall: ${totalDocumented}/${debt.totalTasks} Dokumentiert`;
        this.statusBarItem.tooltip = `Integrationsschuld: ${debt.debtPercentage}% | Klicke, um das Dashboard zu öffnen`;
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
// ================================================================================================
// EXTENSION AKTIVIERUNG & REGISTRIERUNG
// ================================================================================================
let heimdall;
async function activate(context) {
    const initializeHeimdall = async () => {
        const engine = await HeimdallWorkflowEngine.create(context);
        if (engine) {
            heimdall = engine;
            vscode.window.showInformationMessage('🛡️ Heimdall Workflow Engine ist bereit.');
        }
    };
    context.subscriptions.push(vscode.commands.registerCommand('heimdall.showDashboard', () => heimdall?.showDashboard()), vscode.commands.registerCommand('heimdall.explainCode', () => heimdall?.explainCodeByAI()), vscode.commands.registerCommand('heimdall.classifyTask', () => heimdall?.classifyTask()), vscode.commands.registerCommand('heimdall.promoteTask', () => { }), vscode.commands.registerCommand('heimdall.realityCheck', () => { }), vscode.commands.registerCommand('heimdall.reportDebt', () => { }), vscode.commands.registerCommand('heimdall.refresh', () => heimdall?.scanWorkspaceForTasks()), vscode.commands.registerCommand('heimdall.addTask', () => heimdall?.addNewTask()), vscode.commands.registerCommand('heimdall.openRules', async () => {
        if (vscode.workspace.workspaceFolders) {
            const rulesPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.heimdall', 'rules.json');
            const doc = await vscode.workspace.openTextDocument(rulesPath);
            await vscode.window.showTextDocument(doc);
        }
    }), vscode.commands.registerCommand('heimdall.openDirectives', async () => {
        if (vscode.workspace.workspaceFolders) {
            const directivesPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '.heimdall', 'core_directives.md');
            const doc = await vscode.workspace.openTextDocument(directivesPath);
            await vscode.window.showTextDocument(doc);
        }
    }));
    await initializeHeimdall();
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.md');
    context.subscriptions.push(watcher);
    const refreshWithDebounce = debounce(() => heimdall?.scanWorkspaceForTasks(), 500);
    watcher.onDidChange(refreshWithDebounce);
    watcher.onDidCreate(refreshWithDebounce);
    watcher.onDidDelete(refreshWithDebounce);
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
        heimdall?.dispose();
        await initializeHeimdall();
    });
}
exports.activate = activate;
function deactivate() {
    heimdall?.dispose();
}
exports.deactivate = deactivate;
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
//# sourceMappingURL=extension.js.map
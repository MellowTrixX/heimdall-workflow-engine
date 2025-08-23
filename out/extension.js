"use strict";
// File: src/extension.ts - Heimdall Workflow Engine v3.0 (Refactored)
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ================================================================================================
// HAUPTKLASSE: HEIMDALL WORKFLOW ENGINE
// ================================================================================================
class HeimdallWorkflowEngine {
    constructor(workspaceRoot, context) {
        this.taskFiles = new Map();
        this.workspaceRoot = workspaceRoot;
        this.context = context;
        // Erstelle das Status Bar Item, aber zeige es erst nach der Initialisierung
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'heimdall.showDashboard';
        context.subscriptions.push(this.statusBarItem);
        // Lade Regeln synchron, da sie für den Start kritisch sind
        this.rules = this.loadRules();
        this.ensureHeimdallStructure();
    }
    /**
     * Statische asynchrone Factory-Methode für die Initialisierung.
     * Stellt sicher, dass die Instanz erst nach dem asynchronen Scan vollständig nutzbar ist.
     */
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
    /**
     * Führt die asynchrone Initialisierung durch (z.B. den initialen Workspace-Scan).
     */
    async initialize() {
        await this.scanWorkspaceForTasks();
        this.statusBarItem.show();
    }
    /**
     * Öffentliche Methode zum Aufräumen von Ressourcen.
     * Wird von der deactivate()-Funktion aufgerufen.
     */
    dispose() {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
            this.webviewPanel = undefined;
        }
        this.statusBarItem.dispose();
    }
    /**
     * Prüft, ob ein Webview-Panel aktiv ist.
     */
    hasActiveWebview() {
        return this.webviewPanel !== undefined;
    }
    // ============================================================================================
    // PHASE 0: GRUNDSTRUKTUR & DATENMODELL (Refactored)
    // ============================================================================================
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
                // Deep merge, um sicherzustellen, dass alle Felder vorhanden sind
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
        return {
            project_rules: {
                require_docs_for_prod: true,
                require_tests_for_prod: true
            },
            agent_rules: {
                default_persona: "Du bist ein Senior-Entwickler, spezialisiert auf sauberen, testbaren Code.",
                forbidden_actions: [
                    "Zugriff auf /etc/passwd",
                    "Netzwerk-Anfragen an nicht-vertrauenswürdige Domains"
                ]
            },
            user_rules: {
                default_commit_prefix: "feat"
            },
            overall_rules: {
                core_directives_path: ".heimdall/core_directives.md"
            }
        };
    }
    getDefaultCoreDirectives() {
        return `# Heimdall Core Directives

## Mission Statement
Heimdall ist der Wächter der Brücke zwischen Plan und Realität.

## Workflow-Prinzipien
1. **Prototyp zuerst**: Jede Idee beginnt als [PROTOTYPE]
2. **Qualität vor Geschwindigkeit**: Nur getesteter und dokumentierter Code wird [PRODUCTION]
3. **Transparenz**: Integrationsschuld wird kontinuierlich gemessen und berichtet

## KI-Agent Richtlinien
- Generiere immer Tests für neuen Code
- Dokumentation muss verständlich und vollständig sein
- Befolge die project_rules strikt

## Status-Definitionen
- **[PROTOTYPE]**: Funktioniert isoliert, oft mit Mock-Daten
- **[INTEGRATION_CANDIDATE]**: Zur Integration ausgewählt, aktive Entwicklung
- **[PRODUCTION]**: Vollständig integriert, getestet, dokumentiert
`;
    }
    // ============================================================================================
    // TASK-PARSER (Phase 0.3) - Refactored for Performance and Robustness
    // ============================================================================================
    /**
     * Scannt den Workspace asynchron nach Markdown-Dateien und parst die Tasks.
     * Dies ist die Hauptmethode zur Aktualisierung des internen Task-Zustands.
     */
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
            this.updateDashboard();
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
        catch (error) {
            // Ignoriert Fehler wie Berechtigungsprobleme leise
        }
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
                // Regex verbessert, um robustere Erkennung zu ermöglichen
                const taskMatch = line.match(/^\s*-\s*\[([xX ~!?])\]\s*(.*)$/);
                if (taskMatch) {
                    const [, statusChar, taskText] = taskMatch;
                    const task = {
                        line: i, // Zeilennummer (0-indiziert) für einfachere Bearbeitung
                        rawText: line,
                        status: this.parseTaskStatus(statusChar),
                        classification: this.parseTaskClassification(taskText),
                        title: this.cleanTaskTitle(taskText),
                        file: path.relative(this.workspaceRoot, filePath)
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
        if (text.toUpperCase().includes('[PROTOTYPE]')) {
            return 'PROTOTYPE';
        }
        if (text.toUpperCase().includes('[INTEGRATION_CANDIDATE]')) {
            return 'INTEGRATION_CANDIDATE';
        }
        if (text.toUpperCase().includes('[PRODUCTION]')) {
            return 'PRODUCTION';
        }
        return 'UNCLASSIFIED';
    }
    cleanTaskTitle(text) {
        return text.replace(/\[(PROTOTYPE|INTEGRATION_CANDIDATE|PRODUCTION)\]\s*/i, '').trim();
    }
    // ============================================================================================
    // PHASE 1: TRAE-BEFEHLE (Refactored for async and robustness)
    // ============================================================================================
    /**
     * Öffnet ein Menü, um einen beliebigen Task im Workspace zu klassifizieren.
     */
    async classifyTask() {
        const allTasks = this.getAllTasks();
        if (allTasks.length === 0) {
            vscode.window.showInformationMessage('🛡️ Keine Tasks gefunden. Erstelle eine .md Datei mit `- [ ] Task-Titel`.');
            return;
        }
        const taskItems = allTasks.map(task => ({
            label: `📝 ${task.title}`,
            description: `${task.classification} | ${task.file}`,
            detail: `Zeile ${task.line + 1}`,
            task: task
        }));
        const selectedItem = await vscode.window.showQuickPick(taskItems, {
            placeHolder: '🎯 Welchen Task möchten Sie klassifizieren?',
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (!selectedItem) {
            return;
        }
        const classifications = [
            { label: '🔬 [PROTOTYPE]', description: 'Funktioniert isoliert, oft mit Mock-Daten', target: 'PROTOTYPE' },
            { label: '⚙️ [INTEGRATION_CANDIDATE]', description: 'Zur Integration ausgewählt, aktive Entwicklung', target: 'INTEGRATION_CANDIDATE' },
            { label: '✅ [PRODUCTION]', description: 'Vollständig integriert, getestet, dokumentiert', target: 'PRODUCTION' }
        ];
        const selectedClassification = await vscode.window.showQuickPick(classifications, {
            placeHolder: `🏷️ Neue Klassifizierung für: ${selectedItem.task.title}`
        });
        if (!selectedClassification) {
            return;
        }
        const newClassification = selectedClassification.target;
        await this.updateTaskClassification(selectedItem.task, newClassification);
    }
    /**
     * Befördert einen Task zum nächsten logischen Status im Workflow.
     */
    async promoteTask() {
        const promotableTasks = this.getAllTasks().filter(task => task.classification === 'PROTOTYPE' || task.classification === 'INTEGRATION_CANDIDATE');
        if (promotableTasks.length === 0) {
            vscode.window.showInformationMessage('🛡️ Keine Tasks zum Befördern gefunden (nur Prototypen und Kandidaten sind möglich).');
            return;
        }
        const taskItems = promotableTasks.map(task => ({
            label: `🔼 ${task.title}`,
            description: `${task.classification} → ${this.getNextClassification(task.classification)}`,
            detail: `${task.file}:${task.line + 1}`,
            task: task
        }));
        const selectedItem = await vscode.window.showQuickPick(taskItems, {
            placeHolder: '🚀 Welchen Task möchten Sie befördern?'
        });
        if (!selectedItem) {
            return;
        }
        const task = selectedItem.task;
        const nextClassification = this.getNextClassification(task.classification);
        if (task.classification === 'INTEGRATION_CANDIDATE' && nextClassification === 'PRODUCTION') {
            const realityCheckPassed = await this.realityCheck(task);
            if (!realityCheckPassed) {
                vscode.window.showWarningMessage(`❌ Reality Check für "${task.title}" fehlgeschlagen. Beförderung abgebrochen.`);
                return;
            }
        }
        await this.updateTaskClassification(task, nextClassification);
        vscode.window.showInformationMessage(`🎉 Task "${task.title}" wurde zu ${nextClassification} befördert!`);
    }
    getNextClassification(current) {
        switch (current) {
            case 'PROTOTYPE': return 'INTEGRATION_CANDIDATE';
            case 'INTEGRATION_CANDIDATE': return 'PRODUCTION';
            default: return current;
        }
    }
    /**
     * Führt den "Reality Check" für einen Task durch, um ihn für die Produktion zu validieren.
     */
    async realityCheck(task) {
        if (!task) {
            const candidateTasks = this.getAllTasks().filter(t => t.classification === 'INTEGRATION_CANDIDATE');
            if (candidateTasks.length === 0) {
                vscode.window.showInformationMessage('🛡️ Keine [INTEGRATION_CANDIDATE] Tasks für einen Reality Check gefunden.');
                return false;
            }
            const taskItems = candidateTasks.map(t => ({
                label: `🔍 ${t.title}`,
                description: `Datei: ${t.file}`,
                task: t
            }));
            const selectedItem = await vscode.window.showQuickPick(taskItems, {
                placeHolder: '🔍 Reality Check für welchen Task durchführen?'
            });
            if (!selectedItem) {
                return false;
            }
            task = selectedItem.task;
        }
        vscode.window.showInformationMessage(`🛡️ Führe Reality Check für "${task.title}" durch...`);
        const rulesChecks = await this.checkProjectRules(task);
        const aiChecks = await this.performAIQualityCheck(task);
        const allChecksPassed = rulesChecks.docs && rulesChecks.tests && aiChecks.codeQuality;
        this.showRealityCheckResults(task, { ...rulesChecks, ...aiChecks });
        return allChecksPassed;
    }
    async updateTaskClassification(task, newClassification) {
        const fileUri = vscode.Uri.file(path.join(this.workspaceRoot, task.file));
        try {
            const contentBytes = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(contentBytes).toString('utf-8');
            const lines = content.split(/\r?\n/);
            if (task.line >= lines.length) {
                throw new Error("Zeilennummer ist außerhalb des gültigen Bereichs.");
            }
            const line = lines[task.line];
            // Entferne alte Klassifikation und füge die neue hinzu.
            // Diese Regex ist robuster gegen mehrfache Tags.
            const textWithoutClassification = line.replace(/\[(PROTOTYPE|INTEGRATION_CANDIDATE|PRODUCTION|UNCLASSIFIED)\]\s*/ig, '');
            const checkboxMatch = textWithoutClassification.match(/^(\s*- \[[^\]]\]\s*)/);
            if (!checkboxMatch) {
                throw new Error("Keine gültige Task-Checkbox gefunden.");
            }
            const prefix = checkboxMatch[0];
            const title = textWithoutClassification.substring(prefix.length).trim();
            const newLine = `${prefix}[${newClassification}] ${title}`;
            lines[task.line] = newLine;
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(lines.join('\n'), 'utf-8'));
            // Aktualisiere internen Cache und UI
            task.classification = newClassification;
            task.rawText = newLine;
            task.title = title;
            this.updateStatusBar();
            this.updateDashboard();
            vscode.window.setStatusBarMessage(`🛡️ Task zu [${newClassification}] klassifiziert`, 3000);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Fehler beim Aktualisieren des Tasks: ${message}`);
        }
    }
    async checkProjectRules(task) {
        let hasTests = false;
        let hasDocs = false;
        // Vereinfachte Implementierung - sucht nach entsprechenden Dateien im gesamten Workspace
        const taskNameSlug = task.title.toLowerCase().replace(/[\s_]+/g, '-');
        // Suche nach Testdateien
        const testPatterns = new vscode.RelativePattern(this.workspaceRoot, `**/*${taskNameSlug}*.{test,spec}.{ts,js}`);
        const testFiles = await vscode.workspace.findFiles(testPatterns, '**/node_modules/**', 1);
        hasTests = testFiles.length > 0;
        // Suche nach Dokumentationsdateien
        const docPatterns = new vscode.RelativePattern(this.workspaceRoot, `**/*${taskNameSlug}*.md`);
        const docFiles = await vscode.workspace.findFiles(docPatterns, '**/node_modules/**', 1);
        hasDocs = docFiles.length > 0;
        return {
            docs: !this.rules.project_rules.require_docs_for_prod || hasDocs,
            tests: !this.rules.project_rules.require_tests_for_prod || hasTests
        };
    }
    async performAIQualityCheck(task) {
        // Hier würde die echte KI-Integration stattfinden (z.B. Aufruf an Ollama)
        // Für die Demo simulieren wir das Ergebnis mit einer kurzen Verzögerung
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simuliere AI-Analysezeit
        const suggestions = [
            "Die Code-Struktur ist logisch und gut nachvollziehbar.",
            "Variablen- und Funktionsnamen sind aussagekräftig gewählt.",
            "Die Funktion ist gut auf eine einzelne Aufgabe fokussiert.",
            "Es wurden keine offensichtlichen Sicherheitsrisiken oder Anti-Patterns erkannt."
        ];
        // Simuliere eine 80%ige Erfolgschance
        const success = Math.random() > 0.2;
        return {
            codeQuality: success,
            aiSuggestions: success ? suggestions.join('\n• ') : "Die Funktion scheint unnötig komplex. Ein Refactoring zur Vereinfachung wird empfohlen."
        };
    }
    showRealityCheckResults(task, results) {
        const panel = vscode.window.createWebviewPanel('realityCheck', `🔍 Reality Check: ${task.title}`, vscode.ViewColumn.Beside, { enableScripts: false } // Keine Skripte im reinen Info-Panel benötigt
        );
        const success = results.docs && results.tests && results.codeQuality;
        const successColor = 'var(--vscode-terminal-ansiGreen)';
        const errorColor = 'var(--vscode-terminal-ansiRed)';
        panel.webview.html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; font-size: var(--vscode-font-size); }
                h1, h2, h3 { font-weight: bold; }
                .success { color: ${successColor}; }
                .error { color: ${errorColor}; }
                .result-item { margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 5px solid; }
                .result-pass { border-left-color: ${successColor}; background: rgba(45, 212, 191, 0.1); }
                .result-fail { border-left-color: ${errorColor}; background: rgba(244, 63, 94, 0.1); }
                ul { list-style-type: none; padding-left: 0; }
                li { margin-bottom: 5px; }
            </style>
        </head>
        <body>
            <h1>🛡️ Heimdall Reality Check</h1>
            <h2>Task: ${task.title}</h2>
            <p>Datei: ${task.file}</p>
            
            <div class="result-item ${results.docs ? 'result-pass' : 'result-fail'}">
                <strong>${results.docs ? '✅ Dokumentation' : '❌ Dokumentation'}</strong>: ${results.docs ? 'Anforderung erfüllt' : 'Anforderung nicht erfüllt'}
            </div>
            
            <div class="result-item ${results.tests ? 'result-pass' : 'result-fail'}">
                <strong>${results.tests ? '✅ Tests' : '❌ Tests'}</strong>: ${results.tests ? 'Anforderung erfüllt' : 'Anforderung nicht erfüllt'}
            </div>
            
            <div class="result-item ${results.codeQuality ? 'result-pass' : 'result-fail'}">
                <strong>${results.codeQuality ? '✅ KI Code-Qualität' : '❌ KI Code-Qualität'}</strong>: ${results.codeQuality ? 'Bestanden' : 'Verbesserung nötig'}
            </div>
            
            <h3>🤖 KI-Vorschläge:</h3>
            <ul>
                <li>${results.aiSuggestions.replace(/\n• /g, '</li><li>')}</li>
            </ul>
            
            <h2 class="${success ? 'success' : 'error'}">
                ${success ? '🎉 Reality Check BESTANDEN!' : '❌ Reality Check FEHLGESCHLAGEN'}
            </h2>
            
            ${success ?
            '<p class="success">Dieser Task kann sicher zu [PRODUCTION] befördert werden.</p>' :
            '<p class="error">Bitte beheben Sie die markierten Probleme, bevor Sie den Task erneut befördern.</p>'}
        </body>
        </html>
        `;
    }
    // ============================================================================================
    // PHASE 2: UI & VISUALISIERUNG (Refactored)
    // ============================================================================================
    showDashboard() {
        const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.One;
        if (this.webviewPanel) {
            this.webviewPanel.reveal(column);
            return;
        }
        this.webviewPanel = vscode.window.createWebviewPanel('heimdallDashboard', '🛡️ Heimdall Dashboard', column, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
        });
        this.webviewPanel.onDidDispose(() => { this.webviewPanel = undefined; }, null, this.context.subscriptions);
        this.webviewPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'heimdall.refresh':
                    this.scanWorkspaceForTasks();
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
        this.updateDashboard();
    }
    updateDashboard() {
        if (!this.webviewPanel) {
            return;
        }
        this.scanWorkspaceForTasks(); // Immer die neuesten Tasks laden
        const debt = this.calculateIntegrationDebt();
        const allTasks = this.getAllTasks();
        if (allTasks.length === 0) {
            this.webviewPanel.webview.html = this.getWelcomeDashboardHTML();
        }
        else {
            this.webviewPanel.webview.html = this.getDashboardHTML(allTasks, debt);
        }
    }
    calculateIntegrationDebt() {
        const allTasks = this.getAllTasks();
        const total = allTasks.length;
        if (total === 0) {
            return { totalTasks: 0, prototypes: 0, integrationCandidates: 0, production: 0, unclassified: 0, debtPercentage: 0 };
        }
        const prototypes = allTasks.filter(t => t.classification === 'PROTOTYPE').length;
        const candidates = allTasks.filter(t => t.classification === 'INTEGRATION_CANDIDATE').length;
        const production = allTasks.filter(t => t.classification === 'PRODUCTION').length;
        const unclassified = allTasks.filter(t => t.classification === 'UNCLASSIFIED').length;
        const nonProductionTasks = prototypes + candidates + unclassified;
        const debtPercentage = Math.round((nonProductionTasks / total) * 100);
        return { totalTasks: total, prototypes, integrationCandidates: candidates, production, unclassified, debtPercentage };
    }
    async reportDebt() {
        const debt = this.calculateIntegrationDebt();
        const report = `
# 📊 Heimdall Integration Debt Report

## Übersicht
- **Gesamt Tasks:** ${debt.totalTasks}
- **Integrationsschuld:** ${debt.debtPercentage}%

## Verteilung
- 🔬 **Prototypen:** ${debt.prototypes} (${debt.totalTasks > 0 ? Math.round((debt.prototypes / debt.totalTasks) * 100) : 0}%)
- ⚙️ **Integration Candidates:** ${debt.integrationCandidates} (${debt.totalTasks > 0 ? Math.round((debt.integrationCandidates / debt.totalTasks) * 100) : 0}%)
- ✅ **Produktiv:** ${debt.production} (${debt.totalTasks > 0 ? Math.round((debt.production / debt.totalTasks) * 100) : 0}%)
- ❓ **Unklassifiziert:** ${debt.unclassified} (${debt.totalTasks > 0 ? Math.round((debt.unclassified / debt.totalTasks) * 100) : 0}%)

## Empfehlungen
${debt.debtPercentage > 70 ? '🔴 **KRITISCH**: Sehr hohe Integrationsschuld! Sofortige Maßnahmen zur Reduzierung von Prototypen erforderlich.' :
            debt.debtPercentage > 50 ? '🟡 **WARNUNG**: Hohe Integrationsschuld. Fokus auf die Beförderung von Kandidaten zu [PRODUCTION] empfohlen.' :
                '🟢 **GUT**: Integrationsschuld befindet sich in einem gesunden Bereich. Gute Arbeit!'}

---
*Generiert von Heimdall Workflow Engine am ${new Date().toLocaleString('de-DE')}*
        `;
        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }
    getWelcomeDashboardHTML() {
        const nonce = this.getNonce();
        return `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Heimdall Dashboard</title>
            <style>
                body, html { 
                    margin: 0; padding: 0; height: 100%; display: flex; 
                    align-items: center; justify-content: center; 
                    font-family: var(--vscode-font-family); 
                    background-color: var(--vscode-editor-background); 
                    color: var(--vscode-foreground); 
                }
                .container { text-align: center; padding: 20px; }
                h1 { font-size: 1.5em; }
                p { color: var(--vscode-descriptionForeground); }
                button { 
                    background-color: var(--vscode-button-background); 
                    color: var(--vscode-button-foreground); 
                    border: 1px solid var(--vscode-button-border);
                    padding: 10px 20px; border-radius: 4px; cursor: pointer;
                    margin-top: 20px;
                }
                button:hover { background-color: var(--vscode-button-hoverBackground); }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🛡️ Heimdall Workflow Engine</h1>
                <p>Im aktuellen Workspace wurden keine Markdown-Dateien mit Tasks gefunden.</p>
                <p>Erstellen Sie eine <code>.md</code>-Datei mit Einträgen wie <code>- [ ] Mein erster Task</code>, um zu beginnen.</p>
                <button id="refreshBtn">🔄 Workspace neu scannen</button>
            </div>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                document.getElementById('refreshBtn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'heimdall.refresh' });
                });
            </script>
        </body>
        </html>`;
    }
    getDashboardHTML(tasks, debt) {
        const nonce = this.getNonce();
        const taskRows = tasks.map(task => {
            const statusIcon = this.getStatusIcon(task.status);
            const classIcon = this.getClassificationIcon(task.classification);
            return `
            <tr data-file="${task.file}" data-line="${task.line}" title="Klicken, um zur Datei zu springen">
                <td class="icon-cell">${statusIcon}</td>
                <td class="icon-cell">${classIcon}</td>
                <td>${this.escapeHtml(task.title)}</td>
                <td>${this.escapeHtml(task.file)}</td>
                <td>${task.line + 1}</td>
            </tr>
            `;
        }).join('');
        const productionPercent = debt.totalTasks > 0 ? (debt.production / debt.totalTasks) * 100 : 0;
        const candidatePercent = debt.totalTasks > 0 ? (debt.integrationCandidates / debt.totalTasks) * 100 : 0;
        const prototypePercent = debt.totalTasks > 0 ? (debt.prototypes / debt.totalTasks) * 100 : 0;
        const unclassifiedPercent = debt.totalTasks > 0 ? (debt.unclassified / debt.totalTasks) * 100 : 0;
        return `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Heimdall Dashboard</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
                .header { text-align: center; margin-bottom: 20px; }
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
                .progress-production { background-color: var(--vscode-terminal-ansiGreen); }
                .progress-candidate { background-color: var(--vscode-terminal-ansiYellow); }
                .progress-prototype { background-color: var(--vscode-terminal-ansiRed); }
                .progress-unclassified { background-color: var(--vscode-terminal-ansiBrightBlack); }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🛡️ Heimdall Workflow Engine</h1>
                <p><em>Der Wächter der Brücke zwischen Plan und Realität</em></p>
            </div>

            <div class="debt-summary">
                <div class="debt-item"><div class="debt-number">${debt.totalTasks}</div><div>Gesamt Tasks</div></div>
                <div class="debt-item"><div class="debt-number" style="color: var(--vscode-terminal-ansiRed)">${debt.prototypes}</div><div>Prototypen</div></div>
                <div class="debt-item"><div class="debt-number" style="color: var(--vscode-terminal-ansiYellow)">${debt.integrationCandidates}</div><div>Kandidaten</div></div>
                <div class="debt-item"><div class="debt-number" style="color: var(--vscode-terminal-ansiGreen)">${debt.production}</div><div>Produktiv</div></div>
            </div>

            <div class="progress-bar" title="Verteilung: ${productionPercent.toFixed(0)}% Produktiv, ${candidatePercent.toFixed(0)}% Kandidaten, ${prototypePercent.toFixed(0)}% Prototypen, ${unclassifiedPercent.toFixed(0)}% Unklassifiziert">
                <div class="progress-production" style="width: ${productionPercent}%"></div>
                <div class="progress-candidate" style="width: ${candidatePercent}%"></div>
                <div class="progress-prototype" style="width: ${prototypePercent}%"></div>
                <div class="progress-unclassified" style="width: ${unclassifiedPercent}%"></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th class="icon-cell">Status</th><th class="icon-cell">Klass.</th><th>Task</th><th>Datei</th><th>Zeile</th>
                    </tr>
                </thead>
                <tbody>
                    ${taskRows}
                </tbody>
            </table>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                document.querySelectorAll('tbody tr').forEach(row => {
                    row.addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'heimdall.openFile',
                            file: row.dataset.file,
                            line: parseInt(row.dataset.line, 10)
                        });
                    });
                });
            </script>
        </body>
        </html>
        `;
    }
    // ============================================================================================
    // HILFSMETHODEN
    // ============================================================================================
    getAllTasks() {
        return Array.from(this.taskFiles.values()).flat();
    }
    updateStatusBar() {
        const debt = this.calculateIntegrationDebt();
        this.statusBarItem.text = `🛡️ Heimdall: ${debt.production}/${debt.totalTasks} Produktiv`;
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
    getStatusIcon(status) {
        switch (status) {
            case 'checked': return '✅';
            case 'cancelled': return '❌';
            case 'important': return '❗';
            case 'question': return '❓';
            default: return '📋';
        }
    }
    getClassificationIcon(classification) {
        switch (classification) {
            case 'PROTOTYPE': return '🔬';
            case 'INTEGRATION_CANDIDATE': return '⚙️';
            case 'PRODUCTION': return '✅';
            default: return '❓';
        }
    }
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
    // BEFEHLSREGISTRIERUNG
    context.subscriptions.push(vscode.commands.registerCommand('heimdall.classifyTask', () => heimdall?.classifyTask()), vscode.commands.registerCommand('heimdall.promoteTask', () => heimdall?.promoteTask()), vscode.commands.registerCommand('heimdall.realityCheck', () => heimdall?.realityCheck()), vscode.commands.registerCommand('heimdall.showDashboard', () => heimdall?.showDashboard()), vscode.commands.registerCommand('heimdall.reportDebt', () => heimdall?.reportDebt()), vscode.commands.registerCommand('heimdall.refresh', () => heimdall?.scanWorkspaceForTasks()), vscode.commands.registerCommand('heimdall.openRules', async () => {
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
    // Initialisiere beim Start
    await initializeHeimdall();
    // File Watcher für Live-Sync (Phase 2.3)
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.md');
    context.subscriptions.push(watcher);
    const refreshWithDebounce = debounce(() => heimdall?.scanWorkspaceForTasks(), 1000);
    watcher.onDidChange(refreshWithDebounce);
    watcher.onDidCreate(refreshWithDebounce);
    watcher.onDidDelete(refreshWithDebounce);
    // Re-initialisiere, wenn ein Ordner geöffnet/geschlossen wird
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
        if (heimdall) {
            heimdall.dispose(); // Verwende die neue öffentliche dispose-Methode
        }
        await initializeHeimdall();
    });
}
function deactivate() {
    if (heimdall) {
        heimdall.dispose(); // Verwende die neue öffentliche dispose-Methode
    }
}
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}
//# sourceMappingURL=extension.js.map
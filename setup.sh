# ===================================================================
# 🛡️ HEIMDALL WORKFLOW ENGINE - VOLLSTÄNDIGES SETUP SCRIPT
# "Der Wächter der Brücke zwischen Plan und Realität"
# ===================================================================

# --- NEU: Setze das Arbeitsverzeichnis auf den Ort des Skripts ---
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path $scriptPath -Parent
Set-Location $scriptDir
# ------------------------------------------------------------------

Write-Host @"
🛡️ ========================================
   HEIMDALL WORKFLOW ENGINE SETUP v2.0
   Der Wächter der Brücke zwischen Plan 
   und Realität wird initialisiert...
========================================
"@ -ForegroundColor Cyan

# Prüfe Grundvoraussetzungen
if (!(Test-Path "package.json")) {
    Write-Host "❌ Fehler: Nicht im Extension-Root-Verzeichnis!" -ForegroundColor Red
    Write-Host "💡 Bitte im VS Code Extension Projekt-Ordner ausführen" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Extension-Projekt gefunden" -ForegroundColor Green

# ===================================================================
# PHASE 0: GRUNDSTRUKTUR & DATENMODELL
# ===================================================================

Write-Host "`n📁 PHASE 0: Erstelle Heimdall-Grundstruktur..." -ForegroundColor Yellow

# .heimdall Konfigurationsordner
if (!(Test-Path ".heimdall")) {
    New-Item -ItemType Directory -Name ".heimdall" | Out-Null
    Write-Host "✅ .heimdall/ Konfigurationsordner erstellt" -ForegroundColor Green
} else {
    Write-Host "✅ .heimdall/ bereits vorhanden" -ForegroundColor Green
}

# rules.json erstellen
$rulesJson = @"
{
  "project_rules": {
    "require_docs_for_prod": true,
    "require_tests_for_prod": true
  },
  "agent_rules": {
    "default_persona": "Du bist ein Senior-Entwickler, spezialisiert auf sauberen, testbaren Code.",
    "forbidden_actions": [
      "Zugriff auf /etc/passwd",
      "Netzwerk-Anfragen an nicht-vertrauenswürdige Domains"
    ]
  },
  "user_rules": {
    "default_commit_prefix": "feat"
  },
  "overall_rules": {
    "core_directives_path": ".heimdall/core_directives.md"
  }
}
"@

$rulesJson | Out-File -FilePath ".heimdall/rules.json" -Encoding UTF8 -Force
Write-Host "✅ .heimdall/rules.json erstellt" -ForegroundColor Green

# core_directives.md erstellen
$coreDirectives = @"
# 🛡️ Heimdall Core Directives

## Mission Statement
Heimdall ist der Wächter der Brücke zwischen Plan und Realität.
Unser Ziel: Die Bekämpfung der Integrationsschuld durch strukturierte Task-Klassifizierung.

## Die Freya & Trae Methodologie

### Freya (Lead Architect & Executor)
- **Prinzip**: Plan → Approve → Execute → Verify
- **Fokus**: Sorgfältige Planung und strukturierte Ausführung
- **Verantwortung**: Architektur und Implementation

### Trae (Reality Anchor & Quality Gatekeeper)  
- **Prinzip**: Unerbittliche Prüfung von Code, Daten und Integration
- **Fokus**: Bekämpfung der Integrationsschuld
- **Verantwortung**: Quality Gates und Reality Checks

## Der Trae-Workflow: Dreistufiges Klassifizierungssystem

### 1. [PROTOTYPE] 🔬
- **Definition**: Die Idee funktioniert isoliert, oft mit Mock-Daten
- **Kriterien**: Proof-of-Concept implementiert
- **Nächster Schritt**: trae::promote zu INTEGRATION_CANDIDATE

### 2. [INTEGRATION_CANDIDATE] ⚙️  
- **Definition**: Prototyp zur Integration ausgewählt, aktive Entwicklung
- **Kriterien**: Code implementiert, aber noch nicht produktionsreif
- **Nächster Schritt**: trae::reality-check für PRODUCTION

### 3. [PRODUCTION] ✅
- **Definition**: Vollständig integriert, getestet und dokumentiert
- **Kriterien**: Alle Quality Gates bestanden
- **Status**: Produktiv einsetzbar

## Quality Gates (Reality Check Kriterien)

### Pflicht-Kriterien für PRODUCTION:
- ✅ **Tests**: Unit-Tests und Integration-Tests vorhanden
- ✅ **Dokumentation**: Code dokumentiert und Benutzer-Dokumentation vorhanden  
- ✅ **Code-Qualität**: ESLint/Prettier Standards eingehalten
- ✅ **Integration**: Abhängigkeiten erfüllt und getestet

### KI-Agent Richtlinien:
- Generiere immer Tests für neuen Code
- Dokumentation muss verständlich und vollständig sein
- Befolge die project_rules strikt
- Verwende den default_persona aus den agent_rules

## Trae-Befehle

- **trae::classify**: Task einem Status zuordnen
- **trae::promote**: Task zum nächsten Level befördern  
- **trae::reality-check**: Quality Gate Prüfung durchführen
- **trae::report-debt**: Integration Debt Report generieren

---

> "Too many shells, not enough kernels. 
> We need to shift our focus from the quantity of features 
> to the quality of integration."

*Erstellt am $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') von Heimdall Setup*
"@

$coreDirectives | Out-File -FilePath ".heimdall/core_directives.md" -Encoding UTF8 -Force
Write-Host "✅ .heimdall/core_directives.md erstellt" -ForegroundColor Green

# ===================================================================
# DEMO TASK FILES ERSTELLEN
# ===================================================================

Write-Host "`n📝 Erstelle Demo-Task-Dateien..." -ForegroundColor Yellow

# Hauptprojekt tasks.md
$mainTasks = @"
# 🛡️ Heimdall Workflow Engine - Development Tasks

## PHASE 0: GRUNDSTRUKTUR & DATENMODELL ✅

- [x] [PRODUCTION] Extension-Projekt aufsetzen
- [x] [PRODUCTION] TypeScript, ESLint und Prettier konfigurieren  
- [x] [PRODUCTION] Regel-basiertes Datenmodell definieren
- [x] [PRODUCTION] Task-Parser implementieren

## PHASE 1: DIE "TRAE"-BEFEHLE

- [x] [PRODUCTION] trae::classify Befehl implementieren
- [x] [PRODUCTION] trae::promote Befehl implementieren  
- [x] [INTEGRATION_CANDIDATE] trae::reality-check Befehl implementieren (Der AI Quality Gate)
- [ ] [PROTOTYPE] KI-Integration für automatische Test-Generierung
- [ ] [PROTOTYPE] Git-Integration für automatische Commits bei Status-Änderungen

## PHASE 2: UI & VISUALISIERUNG

- [x] [PRODUCTION] Webview-Panel Dashboard erstellen
- [x] [PRODUCTION] trae::report-debt implementieren
- [x] [INTEGRATION_CANDIDATE] Live-Sync mit File-Watcher implementieren
- [ ] [PROTOTYPE] Multi-User WebSocket-Synchronisation
- [ ] [PROTOTYPE] Erweiterte Dashboard-Visualisierungen (Charts, Diagramme)

## PHASE 3: ADVANCED FEATURES (Zukünftig)

- [ ] [PROTOTYPE] Llama-Coder Integration für Reality Checks
- [ ] [PROTOTYPE] GitHub Issues Synchronisation
- [ ] [PROTOTYPE] Team-Collaboration Features
- [ ] [PROTOTYPE] Task-Dependencies Visualisierung
- [ ] [PROTOTYPE] Automatische Dokumentations-Generierung
- [ ] [PROTOTYPE] Integration Debt Alerts und Notifications

## BUG FIXES & IMPROVEMENTS

- [ ] [INTEGRATION_CANDIDATE] Task-Parser Performance optimieren
- [ ] [PROTOTYPE] Error Handling für File-System Operationen verbessern
- [ ] [PROTOTYPE] Konfiguration über VS Code Settings
- [ ] [INTEGRATION_CANDIDATE] Webview Security Headers implementieren

---

*Task-Status Legende:*
- **[PROTOTYPE]** 🔬 = Funktioniert isoliert, oft mit Mock-Daten
- **[INTEGRATION_CANDIDATE]** ⚙️ = Zur Integration ausgewählt, aktive Entwicklung  
- **[PRODUCTION]** ✅ = Vollständig integriert, getestet und dokumentiert
"@

$mainTasks | Out-File -FilePath "tasks.md" -Encoding UTF8 -Force
Write-Host "✅ tasks.md mit Demo-Tasks erstellt" -ForegroundColor Green

# Erstelle test-workspace für Extension Development
if (!(Test-Path "test-workspace")) {
    New-Item -ItemType Directory -Name "test-workspace" | Out-Null
    Write-Host "✅ test-workspace/ für Extension Development erstellt" -ForegroundColor Green
}

# Demo-Tasks für test-workspace
$testTasks = @"
# 🚀 Beispiel-Projekt: E-Commerce Platform

## Authentication System

- [ ] [PROTOTYPE] User Registration implementieren
- [ ] [PROTOTYPE] Login/Logout Funktionalität
- [ ] [INTEGRATION_CANDIDATE] Password Reset System
- [x] [PRODUCTION] OAuth2 Google Integration
- [x] [PRODUCTION] JWT Token Management

## Shopping Cart Features  

- [x] [PRODUCTION] Add to Cart Funktionalität
- [x] [PRODUCTION] Cart Persistence im LocalStorage
- [ ] [INTEGRATION_CANDIDATE] Cart Quantity Updates
- [ ] [PROTOTYPE] Wishlist Feature
- [ ] [PROTOTYPE] Cart Abandonment Emails

## Payment Processing

- [ ] [INTEGRATION_CANDIDATE] Stripe Integration
- [ ] [PROTOTYPE] PayPal Integration  
- [ ] [PROTOTYPE] Invoice Generation
- [ ] [PROTOTYPE] Refund System

## Admin Dashboard

- [x] [PRODUCTION] User Management Interface
- [ ] [INTEGRATION_CANDIDATE] Product Management
- [ ] [INTEGRATION_CANDIDATE] Order Management System
- [ ] [PROTOTYPE] Analytics Dashboard
- [ ] [PROTOTYPE] Reporting System

## Performance & Optimization

- [ ] [PROTOTYPE] Database Query Optimization
- [ ] [PROTOTYPE] CDN Integration für Static Assets
- [ ] [INTEGRATION_CANDIDATE] API Response Caching
- [ ] [PROTOTYPE] Image Compression Pipeline

---

🛡️ **Heimdall Integration Debt Status:**
- Prototypes: 9 Tasks
- Integration Candidates: 6 Tasks  
- Production: 4 Tasks
- **Debt Level: 79%** ⚠️
"@

$testTasks | Out-File -FilePath "test-workspace/project-tasks.md" -Encoding UTF8 -Force
Write-Host "✅ test-workspace/project-tasks.md erstellt" -ForegroundColor Green

# ===================================================================
# EXTENSION KOMPILIERUNG & SETUP
# ===================================================================

Write-Host "`n🔨 PHASE 1: Extension kompilieren..." -ForegroundColor Yellow

# Prüfe ob node_modules existiert
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installiere Dependencies..." -ForegroundColor Yellow
    try {
        npm install | Out-Null
        Write-Host "✅ npm install erfolgreich" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm install fehlgeschlagen" -ForegroundColor Red
        Write-Host "💡 Führe manuell aus: npm install" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ node_modules bereits vorhanden" -ForegroundColor Green
}

# TypeScript kompilieren
Write-Host "🔨 Kompiliere TypeScript..." -ForegroundColor Yellow
try {
    $compileOutput = npm run compile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript Kompilierung erfolgreich" -ForegroundColor Green
    } else {
        Write-Host "❌ Kompilierung fehlgeschlagen:" -ForegroundColor Red
        Write-Host $compileOutput -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ npm run compile nicht verfügbar" -ForegroundColor Red
    exit 1
}

# Prüfe Ausgabe
if (Test-Path "out/extension.js") {
    $fileSize = (Get-Item "out/extension.js").Length
    Write-Host "✅ extension.js erstellt ($('{0:N0}' -f $fileSize) bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ extension.js nicht gefunden!" -ForegroundColor Red
    exit 1
}

# ===================================================================
# LAUNCH CONFIGURATION
# ===================================================================

Write-Host "`n⚙️ Konfiguriere Debug-Umgebung..." -ForegroundColor Yellow

# .vscode Ordner erstellen falls nicht vorhanden
if (!(Test-Path ".vscode")) {
    New-Item -ItemType Directory -Name ".vscode" | Out-Null
}

$launchJson = @"
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost", 
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=`${workspaceFolder}"
            ],
            "outFiles": [
                "`${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "npm: compile"
        }
    ]
}
"@

$launchJson | Out-File -FilePath ".vscode/launch.json" -Encoding UTF8 -Force
Write-Host "✅ .vscode/launch.json konfiguriert" -ForegroundColor Green

Write-Host "`n🚀 Setup abgeschlossen! Projekt ist bereit zum Start." -ForegroundColor Green
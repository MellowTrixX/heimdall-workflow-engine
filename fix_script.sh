# HDall_Fengine Debug Fix Script
# Einfache Version für Ihr aktuelles Setup

Write-Host "🛡️ np" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# 1. Prüfe ob package.json existiert
if (!(Test-Path "package.json")) {
    Write-Host "❌ Fehler: Nicht im richtigen Verzeichnis!" -ForegroundColor Red
    Write-Host "💡 Bitte im Extension-Root ausführen (wo package.json liegt)" -ForegroundColor Yellow
    exit 1
}

# 2. Erstelle test-workspace mit heimdall.tasks.json
Write-Host "📁 Erstelle test-workspace..." -ForegroundColor Yellow

if (!(Test-Path "test-workspace")) {
    New-Item -ItemType Directory -Name "test-workspace" | Out-Null
    Write-Host "✅ test-workspace Ordner erstellt" -ForegroundColor Green
}

# Erstelle eine einfache heimdall.tasks.json für Tests
$sampleTasks = @"
[
  {
    "id": "TASK-001",
    "title": "User Authentication System",
    "status": "PROTOTYPE",
    "priority": "HIGH",
    "dependencies": [],
    "verification": "Login and logout work correctly",
    "created": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')",
    "lastModified": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')"
  },
  {
    "id": "TASK-002", 
    "title": "Dashboard UI Implementation",
    "status": "INTEGRATION_CANDIDATE",
    "priority": "MEDIUM",
    "dependencies": ["TASK-001"],
    "verification": "UI matches design system requirements",
    "created": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')",
    "lastModified": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')"
  },
  {
    "id": "TASK-003",
    "title": "Database Connection Setup", 
    "status": "PRODUCTION",
    "priority": "CRITICAL",
    "dependencies": [],
    "verification": "Database queries execute successfully",
    "created": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')",
    "lastModified": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')"
  }
]
"@

$sampleTasks | Out-File -FilePath "test-workspace/heimdall.tasks.json" -Encoding UTF8 -Force
Write-Host "✅ heimdall.tasks.json mit Beispieldaten erstellt" -ForegroundColor Green

# 3. Kompiliere TypeScript
Write-Host "🔨 Kompiliere Extension..." -ForegroundColor Yellow
try {
    $output = npm run compile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript Kompilierung erfolgreich" -ForegroundColor Green
    } else {
        Write-Host "❌ Kompilierung fehlgeschlagen:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        Write-Host "💡 Versuche: npm install" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ npm run compile nicht verfügbar" -ForegroundColor Red
    Write-Host "💡 Führe 'npm install' aus" -ForegroundColor Yellow
    exit 1
}

# 4. Prüfe ob extension.js erstellt wurde
if (Test-Path "out/extension.js") {
    Write-Host "✅ extension.js gefunden in out/" -ForegroundColor Green
} else {
    Write-Host "❌ extension.js nicht gefunden!" -ForegroundColor Red
    Write-Host "💡 Kompilierung war nicht erfolgreich" -ForegroundColor Yellow
    exit 1
}

# 5. Bereinige VS Code Cache (falls vorhanden)
$cachePaths = @(
    "$env:APPDATA\Code\logs",
    "$env:APPDATA\Code\CachedExtensions"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Cache bereinigt: $(Split-Path $path -Leaf)" -ForegroundColor Green
        } catch {
            # Ignoriere Fehler - Cache-Bereinigung ist optional
        }
    }
}

Write-Host ""
Write-Host "🎯 DEBUGGING ANWEISUNGEN:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣ Drücke F5 oder gehe zu Run -> Start Debugging" -ForegroundColor White
Write-Host "2️⃣ Ein neues VS Code Fenster öffnet sich (Extension Development Host)" -ForegroundColor White
Write-Host "3️⃣ In diesem neuen Fenster: File -> Open Folder -> Wähle 'test-workspace'" -ForegroundColor White
Write-Host "4️⃣ Öffne Command Palette: Ctrl+Shift+P" -ForegroundColor White
Write-Host "5️⃣ Tippe: 'HDall_Fengine' und wähle den Befehl aus" -ForegroundColor White
Write-Host ""
Write-Host "🔍 DEIN BEFEHL:" -ForegroundColor Cyan
Write-Host "- HDall_Fengine: Task-Status klassifizieren (rune::mark)" -ForegroundColor White
Write-Host "- Oder benutze Shortcut: Ctrl+Shift+H" -ForegroundColor White
Write-Host ""
Write-Host "📂 TEST-DATEN:" -ForegroundColor Cyan
Write-Host "- test-workspace/heimdall.tasks.json mit 3 Beispiel-Tasks" -ForegroundColor White
Write-Host ""

# 6. Prüfe ob launch.json existiert
if (!(Test-Path ".vscode/launch.json")) {
    Write-Host "⚠️  WARNUNG: .vscode/launch.json nicht gefunden!" -ForegroundColor Yellow
    Write-Host "💡 Erstelle eine launch.json mit folgendem Inhalt:" -ForegroundColor Yellow
    Write-Host ""
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
    Write-Host $launchJson -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ launch.json gefunden" -ForegroundColor Green
}

Write-Host "🚀 Setup abgeschlossen!" -ForegroundColor Green
Write-Host "💡 Tipp: Falls das Extension Development Host Fenster leer bleibt," -ForegroundColor Yellow
Write-Host "   öffne manuell den 'test-workspace' Ordner im neuen Fenster." -ForegroundColor Yellow

# Optional: VS Code automatisch starten
Write-Host ""
$startCode = Read-Host "VS Code jetzt starten? (y/N)"
if ($startCode -eq "y" -or $startCode -eq "Y") {
    try {
        Start-Process "code" -ArgumentList "."
        Write-Host "🚀 VS Code gestartet" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Konnte VS Code nicht automatisch starten" -ForegroundColor Yellow
    }
}
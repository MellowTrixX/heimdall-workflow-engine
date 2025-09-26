import asyncio
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging
import json  # Für Output als JSON

logger = logging.getLogger(__name__)

class FDSAnalyst:
    """
    FDS (Freya Development System) Analyst Agent
    Specializes in requirements analysis and task decomposition
    """
    
    def __init__(self, role: str, goal: str, backstory: str):
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.confidence = 0.88
        
        # Analysis patterns and keywords (erweitert für Freya: Emotions, GUI, Pipelines)
        self.requirement_patterns = {
            "functional": {
                "keywords": ["funktion", "feature", "verhalten", "aktion", "prozess", "workflow", "detect_emotion", "generate_response", "gui_button"],
                "indicators": ["soll", "muss", "kann", "wird", "führt aus", "ermöglicht", "hook", "integrate"]
            },
            "non_functional": {
                "keywords": ["performance", "sicherheit", "usability", "skalierbarkeit", "verfügbarkeit", "latenz", "confidence"],
                "indicators": ["schnell", "sicher", "benutzerfreundlich", "stabil", "zuverlässig", "<200ms", ">0.9"]
            },
            "technical": {
                "keywords": ["api", "datenbank", "server", "client", "protokoll", "architektur", "whisper", "vaderSentiment", "pytest"],
                "indicators": ["implementiert", "verwendet", "basiert auf", "integriert", "migriere", "import"]
            },
            "business": {
                "keywords": ["geschäft", "kunde", "umsatz", "kosten", "roi", "markt", "prod"],
                "indicators": ["erhöht", "reduziert", "verbessert", "optimiert", "96% emp"]
            }
        }
        
        # Task complexity indicators (erweitert für Freya-Levels)
        self.complexity_indicators = {
            "low": ["einfach", "basic", "simpel", "schnell", "direkt", "stub"],
            "medium": ["komplex", "mehrere", "integration", "koordination", "hooks"],
            "high": ["sehr komplex", "kritisch", "enterprise", "skalierbar", "hochverfügbar", "unified_pipeline"]
        }
        
        # Decomposition templates (erweitert für Entwicklung/Integration)
        self.decomposition_templates = {
            "development": [
                "Anforderungsanalyse und Spezifikation",
                "Architektur und Design",
                "Implementierung",
                "Testing und Qualitätssicherung",
                "Deployment und Integration",
                "Dokumentation und Schulung"
            ],
            "analysis": [
                "Problemidentifikation",
                "Datensammlung und -analyse", 
                "Lösungsalternativen bewerten",
                "Empfehlungen entwickeln",
                "Implementierungsplan erstellen"
            ],
            "integration": [
                "Systemanalyse",
                "Schnittstellen definieren",
                "Datenmodell harmonisieren",
                "Implementierung der Konnektoren",
                "Testing und Validierung"
            ],
            "freya_fix": [  # Custom für dein Projekt
                "Migriere docs/.txt zu core/speech/*.py",
                "Fix Imports & Hooks (Kyros, Whisper)",
                "Unified Pipeline bauen (<200ms)",
                "Tests laufen (Pytest/GUI Buttons)",
                "AI-Boost & Retry bei Errors"
            ]
        }
        
        logger.info(f"🔍 FDS Analyst '{role}' initialized")

    async def analyze_requirements(self, input_text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Comprehensive requirements analysis
        """
        start_time = datetime.now()
        
        # Extract and categorize requirements
        requirements = self._extract_requirements(input_text)
        
        # Assess complexity
        complexity = self._assess_complexity(input_text, requirements)
        
        # Identify dependencies
        dependencies = self._identify_dependencies(input_text, requirements)
        
        # Generate work packages
        work_packages = self._generate_work_packages(requirements, complexity)
        
        # Risk assessment
        risks = self._assess_risks(requirements, complexity, dependencies)
        
        # Generate questions for clarification
        clarification_questions = self._generate_clarification_questions(requirements)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        analysis_result = {
            "requirements": requirements,
            "complexity": complexity,
            "dependencies": dependencies,
            "work_packages": work_packages,
            "risks": risks,
            "clarification_questions": clarification_questions,
            "confidence": self._calculate_analysis_confidence(requirements, input_text),
            "processing_time": processing_time,
            "metadata": {
                "input_length": len(input_text),
                "requirements_count": len(requirements),
                "analysis_timestamp": datetime.now().isoformat()
            }
        }
        
        logger.info(f"📊 Requirements analysis completed: {len(requirements)} requirements identified")
        return analysis_result

    def _extract_requirements(self, text: str) -> List[Dict[str, Any]]:
        """Extract and categorize requirements from text"""
        requirements = []
        sentences = re.split(r'[.!?]+', text)
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if len(sentence) < 10:  # Skip very short sentences
                continue
            
            # Categorize requirement
            category = self._categorize_requirement(sentence)
            
            # Extract priority indicators
            priority = self._extract_priority(sentence)
            
            # Extract actors/stakeholders
            actors = self._extract_actors(sentence)
            
            requirement = {
                "id": f"REQ-{i+1:03d}",
                "text": sentence,
                "category": category,
                "priority": priority,
                "actors": actors,
                "complexity": self._estimate_requirement_complexity(sentence),
                "testable": self._is_testable(sentence)
            }
            requirements.append(requirement)
            
        return requirements

    # --- HILFSFUNKTIONEN (jetzt vollständig implementiert mit Logik) ---

    def _categorize_requirement(self, sentence: str) -> str:
        """Categorizes a single requirement sentence."""
        sentence_lower = sentence.lower()
        for category, patterns in self.requirement_patterns.items():
            if any(keyword in sentence_lower for keyword in patterns["keywords"]):
                return category
            if any(indicator in sentence_lower for indicator in patterns["indicators"]):
                return category
        return "unbekannt"

    def _extract_priority(self, sentence: str) -> str:
        """Extracts priority indicators from a sentence."""
        sentence_lower = sentence.lower()
        if any(p in sentence_lower for p in ["muss", "kritisch", "unbedingt", "zwingend", "priority_high"]):
            return "hoch"
        if any(p in sentence_lower for p in ["sollte", "wichtig", "bevorzugt", "priority_medium"]):
            return "mittel"
        if any(p in sentence_lower for p in ["könnte", "optional", "nice to have", "priority_low"]):
            return "niedrig"
        return "mittel"

    def _extract_actors(self, sentence: str) -> List[str]:
        """Extracts potential actors or stakeholders."""
        sentence_lower = sentence.lower()
        actors = []
        if any(a in sentence_lower for a in ["benutzer", "user", "entwickler", "dev"]):
            actors.append("Benutzer/Entwickler")
        if any(a in sentence_lower for a in ["admin", "administrator", "gatekeeper"]):
            actors.append("Administrator")
        if any(a in sentence_lower for a in ["freya", "kyros", "gui"]):
            actors.append("System (Freya/Kyros)")
        return actors

    def _estimate_requirement_complexity(self, sentence: str) -> str:
        """Estimates the complexity of a single requirement."""
        sentence_lower = sentence.lower()
        for level, keywords in self.complexity_indicators.items():
            if any(keyword in sentence_lower for keyword in keywords):
                return level
        # Default: Zähle Keywords (einfach heuristic)
        word_count = len(re.findall(r'\w+', sentence))
        if word_count > 15:
            return "high"
        elif word_count > 8:
            return "medium"
        return "low"

    def _is_testable(self, sentence: str) -> bool:
        """Checks if a requirement sentence is formulated in a testable way."""
        sentence_lower = sentence.lower()
        testable_indicators = ["weniger als", "genau", "innerhalb von", "maximal", "mindestens", ">", "<", "==", "pytest", "test"]
        return any(indicator in sentence_lower for indicator in testable_indicators)

    def _assess_complexity(self, text: str, requirements: List[Dict]) -> str:
        """Assess the overall complexity of the task."""
        req_complexities = [r['complexity'] for r in requirements]
        high_count = sum(1 for c in req_complexities if c == 'high')
        if high_count > len(requirements) * 0.5:
            return 'high'
        elif high_count > 0:
            return 'medium'
        return 'low'

    def _identify_dependencies(self, text: str, requirements: List[Dict]) -> List[str]:
        """Identify dependencies between requirements or on other systems."""
        text_lower = text.lower()
        deps = []
        if any(d in text_lower for d in ['whisper', 'vader', 'kyros', 'freya', 'onxx']):
            deps.append("Abhängigkeit zu Whisper/VADER (NLP-Tools)")
        if any(d in text_lower for d in ['docs', 'migriere', '.txt']):
            deps.append("Abhängigkeit zu docs/-Files für Migration")
        if any(d in text_lower for d in ['gui', 'buttons', 'play']):
            deps.append("Abhängigkeit zu GUI-Interface (nova_interface.py)")
        if len(requirements) > 1:
            deps.append(f"Intra-Requirements-Abhängigkeiten: {len(requirements)} interconnected")
        return deps if deps else ["Keine expliziten Dependencies erkannt"]

    def _generate_work_packages(self, requirements: List[Dict], complexity: str) -> List[str]:
        """Generate a list of high-level work packages."""
        base_template = self.decomposition_templates.get("development", [])
        if "freya" in requirements[0]['text'].lower() if requirements else False:
            base_template = self.decomposition_templates["freya_fix"]
        # Passe an Anzahl Requirements an
        num_packages = min(len(base_template), len(requirements) + 1)
        return base_template[:num_packages]

    def _assess_risks(self, requirements: List[Dict], complexity: str, dependencies: List[str]) -> List[str]:
        """Assess potential risks."""
        risks = ["Generisches Risiko: Unklare Requirements-Formulierung"]
        if complexity == 'high':
            risks.append("Hohe technische Komplexität (z.B. Unified Pipeline)")
        if len(dependencies) > 1:
            risks.append(f"Abhängigkeitsrisiken: {len(dependencies)} externe Komponenten")
        if not all(r['testable'] for r in requirements):
            risks.append("Nicht alle Requirements testbar (z.B. fehlende Metriken)")
        return risks

    def _generate_clarification_questions(self, requirements: List[Dict]) -> List[str]:
        """Generate questions to clarify ambiguities."""
        questions = []
        for req in requirements:
            if req['category'] == 'unbekannt':
                questions.append(f"Clarify REQ-{req['id']}: Welche Kategorie (functional/technical)?")
            if not req['testable']:
                questions.append(f"Make REQ-{req['id']} testable: Welche Metriken (z.B. <200ms Latenz)?")
            if len(req['actors']) == 0:
                questions.append(f"Who is involved in REQ-{req['id']} (z.B. User/Admin)?")
        return questions if questions else ["Keine Clarification nötig – Analyse klar"]

    def _calculate_analysis_confidence(self, requirements: List[Dict], text: str) -> float:
        """Calculate the confidence score of the analysis."""
        base_conf = 0.85
        # Reduziere bei unklaren Categories
        unknown_count = sum(1 for r in requirements if r['category'] == 'unbekannt')
        confidence = base_conf - (unknown_count / max(len(requirements), 1)) * 0.2
        # Boost bei testable/high-priority
        testable_count = sum(1 for r in requirements if r['testable'])
        confidence += (testable_count / len(requirements)) * 0.1
        return round(max(0.5, min(1.0, confidence)), 2)

# CLI/Main für Standalone-Usage (z.B. python fds_analyst.py --input="Dein TRAE-Prompt")
async def main():
    import sys, argparse
    parser = argparse.ArgumentParser(description="FDS Analyst: Analyze Requirements")
    parser.add_argument('--input', '-i', required=True, help="Input text/prompt to analyze")
    parser.add_argument('--output', '-o', default='json', choices=['json', 'text'], help="Output format")
    args = parser.parse_args()
    
    analyst = FDSAnalyst(
        role="Senior Requirements Analyst",
        goal="Decompose complex development tasks into actionable work packages",
        backstory="Experte in AI-assisted software engineering with focus on emotion AI pipelines"
    )
    
    result = await analyst.analyze_requirements(args.input)
    
    if args.output == 'json':
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Requirements: {len(result['requirements'])} | Complexity: {result['complexity']}")
        print("Work Packages:", result['work_packages'])
        print("Risks:", result['risks'])
        print(f"Confidence: {result['confidence']:.2f}")

if __name__ == "__main__":
    asyncio.run(main())
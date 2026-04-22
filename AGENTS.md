<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Development Rules
- **Rule #1**: Al implementar cualquier funcionalidad de IA, DEBES consultar primero `docs/STANDARDS_AI.md`.
- **Rule #2**: NUNCA utilices el SDK de Google GenAI directamente en rutas API. Utiliza siempre la utilidad centralizada en `@/lib/ai/gemini`.
- **Rule #3**: Siempre implementa un sistema de fallback escalonado para manejar errores de cuota (429).

# Estándar de Integración de IA - Resiliencia y Fallback

Este documento define la norma técnica para toda integración de Inteligencia Artificial en nuestras aplicaciones. El objetivo es garantizar la continuidad del servicio frente a límites de cuota (Rate Limits) y fallos del modelo.

## Principio Fundamental

**Resiliencia sobre Selección**: No dependemos de un único modelo. Todo flujo de IA debe implementar un sistema de escalonamiento (fallback) automático.

## Arquitectura

Toda llamada a una IA debe canalizarse a través de una utilidad centralizada (ej. `src/lib/ai/gemini.ts`). **Queda prohibida la invocación directa del SDK de Google GenAI en las rutas API o componentes.**

### Jerarquía de Modelos (Tiers)

El orden de prioridad se define de mayor a menor capacidad/costo:

1.  **Tier 1 (Pro)**: Razonamiento avanzado y análisis complejo (ej. `gemini-3.1-pro-preview`).
2.  **Tier 2 (Flash)**: Balance óptimo de velocidad y capacidad. Modelo de trabajo principal (ej. `gemini-3-flash-preview`).
3.  **Tier 3 (Lite)**: Alta eficiencia y baja latencia (ej. `gemini-3.1-flash-lite-preview`).
4.  **Tier 4 (Legacy)**: Estabilidad garantizada de generación anterior (ej. `gemini-2.5-flash`).

### Manejo de Errores

El sistema debe capturar específicamente errores de tipo `429 (Too Many Requests)` y `5xx (Server Error)`.
- Si ocurre un error de este tipo, el sistema DEBE registrar el incidente (`console.warn`) e intentar inmediatamente con el siguiente modelo en la jerarquía.
- Solo si el último modelo de la lista falla, se devolverá un error al usuario.

## Actualización y Futuro (Gemini 4+)

Cuando se publiquen nuevos modelos (ej. Gemini 4), el procedimiento es:
1.  Verificar el nuevo model ID en Google AI Studio.
2.  Actualizar la lista `models` en la utilidad centralizada (o en las variables de entorno).
3.  No se requiere modificar ninguna ruta API ni lógica de negocio.

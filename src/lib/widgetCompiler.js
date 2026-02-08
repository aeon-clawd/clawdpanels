import { transform } from 'sucrase'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * Compiles a JSX widget string into a live React component.
 * 
 * The agent generates code like:
 * ```
 * function Widget({ config, onConfigChange, size }) {
 *   return <div>Hello {config.title}</div>
 * }
 * ```
 * 
 * We compile the JSX → JS, wrap it in a function scope with React available,
 * and return a usable component.
 */
export function compileWidget(jsxCode) {
  try {
    // Transform JSX to JS
    const { code } = transform(jsxCode, {
      transforms: ['jsx'],
      jsxRuntime: 'classic',
      production: true,
    })

    // Create a module scope with React and hooks available
    const moduleScope = new Function(
      'React',
      'useState',
      'useEffect', 
      'useRef',
      'useCallback',
      'useMemo',
      `
      ${code}
      
      // Return the Widget component (try common export patterns)
      if (typeof Widget !== 'undefined') return Widget;
      if (typeof exports !== 'undefined' && exports.default) return exports.default;
      throw new Error('Widget component not found. Define a function called "Widget".');
      `
    )

    const Component = moduleScope(
      React, useState, useEffect, useRef, useCallback, useMemo
    )

    // Validate it's a function/component
    if (typeof Component !== 'function') {
      throw new Error('Compiled widget is not a valid React component')
    }

    return { success: true, component: Component }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Parse a widget definition from agent response.
 * 
 * Expected format from agent:
 * ```json
 * {
 *   "widget": {
 *     "id": "my-widget",
 *     "name": "My Widget",
 *     "description": "Does something cool",
 *     "icon": "🎯",
 *     "category": "general",
 *     "defaultSize": { "w": 4, "h": 3 },
 *     "configSchema": { ... },
 *     "code": "function Widget({ config }) { return <div>...</div> }"
 *   }
 * }
 * ```
 */
export function parseWidgetFromResponse(text) {
  // Try to find JSON block in the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || 
                    text.match(/```\s*({\s*"widget"[\s\S]*?})```/)
  
  // Try to find JSX/code block
  const codeMatch = text.match(/```(?:jsx?|tsx?)\s*([\s\S]*?)```/)

  let widgetDef = null

  // Parse JSON definition if found
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      widgetDef = parsed.widget || parsed
    } catch (e) {
      // Not valid JSON, continue
    }
  }

  // If we have a code block but no JSON, create a basic definition
  if (!widgetDef && codeMatch) {
    widgetDef = {
      id: `custom-${Date.now()}`,
      name: 'Custom Widget',
      description: 'Created by agent',
      icon: '🧩',
      category: 'general',
      defaultSize: { w: 4, h: 3 },
      code: codeMatch[1].trim(),
    }
  }

  // If JSON def has separate code block, merge
  if (widgetDef && !widgetDef.code && codeMatch) {
    widgetDef.code = codeMatch[1].trim()
  }

  return widgetDef
}

/**
 * Full pipeline: parse agent response → compile widget → return definition with live component
 */
export function processWidgetResponse(text) {
  const widgetDef = parseWidgetFromResponse(text)
  
  if (!widgetDef) {
    return { success: false, error: 'No widget definition found in response' }
  }

  if (!widgetDef.code) {
    return { success: false, error: 'Widget definition has no code' }
  }

  const compiled = compileWidget(widgetDef.code)
  
  if (!compiled.success) {
    return { success: false, error: `Compilation failed: ${compiled.error}`, widgetDef }
  }

  return {
    success: true,
    definition: {
      id: widgetDef.id || `custom-${Date.now()}`,
      name: widgetDef.name || 'Custom Widget',
      description: widgetDef.description || 'Created by agent',
      icon: widgetDef.icon || '🧩',
      category: widgetDef.category || 'general',
      defaultSize: widgetDef.defaultSize || { w: 4, h: 3 },
      minSize: widgetDef.minSize || { w: 2, h: 2 },
      configSchema: widgetDef.configSchema || {},
      component: compiled.component,
      code: widgetDef.code, // Store original code for persistence
      builtin: false,
    }
  }
}

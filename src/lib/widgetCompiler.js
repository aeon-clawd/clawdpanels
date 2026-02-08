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
    // Clean up the code — sometimes agents include non-JS content
    let cleanCode = jsxCode.trim()
    
    // If code doesn't start with 'function' or 'const' or '//', 
    // try to find where the actual function starts
    if (!cleanCode.match(/^(function |const |let |\/\/|\/\*|export )/)) {
      const funcStart = cleanCode.search(/function\s+Widget/)
      if (funcStart > 0) {
        cleanCode = cleanCode.slice(funcStart)
      } else {
        // Maybe it's wrapped in something weird, try to extract function block
        const funcMatch = cleanCode.match(/(function\s+Widget[\s\S]*$)/)
        if (funcMatch) {
          cleanCode = funcMatch[1]
        }
      }
    }
    
    // Remove any 'export default' or 'export' keywords (not supported in our scope)
    cleanCode = cleanCode.replace(/^export\s+default\s+/gm, '')
    cleanCode = cleanCode.replace(/^export\s+/gm, '')

    // Transform JSX to JS
    const { code } = transform(cleanCode, {
      transforms: ['jsx'],
      jsxRuntime: 'classic',
      production: true,
    })

    // Create a module scope with React and hooks available
    // Also alias React.useState etc. since some models use that pattern
    const moduleScope = new Function(
      'React',
      'useState',
      'useEffect', 
      'useRef',
      'useCallback',
      'useMemo',
      `
      // Ensure React.useState etc. also work
      if (!React.useState) React.useState = useState;
      if (!React.useEffect) React.useEffect = useEffect;
      if (!React.useRef) React.useRef = useRef;
      if (!React.useCallback) React.useCallback = useCallback;
      if (!React.useMemo) React.useMemo = useMemo;
      
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
  // Try to find all JSON blocks
  const jsonBlocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)]
  
  // Try to find JSX/code blocks — get ALL of them
  const codeBlocks = [...text.matchAll(/```(?:jsx?|tsx?)\s*([\s\S]*?)```/g)]
  
  // Find the code block that actually contains a Widget function
  let codeMatch = null
  for (const block of codeBlocks) {
    if (block[1].includes('function Widget') || block[1].includes('Widget(')) {
      codeMatch = block
      break
    }
  }
  // Fallback to last code block if none has Widget
  if (!codeMatch && codeBlocks.length > 0) {
    codeMatch = codeBlocks[codeBlocks.length - 1]
  }

  let widgetDef = null

  // Look through JSON blocks for widget metadata
  for (const match of jsonBlocks) {
    try {
      const parsed = JSON.parse(match[1])
      // Check if this looks like widget metadata (has id, name, or widget key)
      if (parsed.widget) {
        widgetDef = parsed.widget
        break
      }
      if (parsed.id && parsed.name) {
        widgetDef = parsed
        break
      }
      // Skip JSON blocks that are just data (arrays, configs without id/name)
    } catch (e) {
      // Not valid JSON, continue
    }
  }

  // If we have a code block but no proper JSON metadata, create a basic definition
  // Try to infer name from the code or surrounding text
  if (!widgetDef && codeMatch) {
    // Try to extract a name from the text before the code block
    const nameMatch = text.match(/(?:create|build|make|here's|here is).*?(?:a |an |the )(.+?)(?:widget|component)/i)
    const inferredName = nameMatch ? nameMatch[1].trim() : 'Custom Widget'
    
    widgetDef = {
      id: `custom-${Date.now()}`,
      name: inferredName.charAt(0).toUpperCase() + inferredName.slice(1),
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

  // Ensure required fields
  if (widgetDef) {
    widgetDef.id = widgetDef.id || `custom-${Date.now()}`
    widgetDef.name = widgetDef.name || 'Custom Widget'
    widgetDef.icon = widgetDef.icon || '🧩'
    widgetDef.category = widgetDef.category || 'general'
    widgetDef.defaultSize = widgetDef.defaultSize || { w: 4, h: 3 }
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

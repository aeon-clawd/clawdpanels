// Quick smoke test for the widget compiler
import { compileWidget, parseWidgetFromResponse, processWidgetResponse } from './widgetCompiler.js'

// Test 1: Basic compilation
const result1 = compileWidget(`
function Widget({ config }) {
  return React.createElement('div', null, 'Hello ', config.name || 'World')
}
`)
console.log('Test 1 (compile):', result1.success ? 'PASS' : 'FAIL - ' + result1.error)

// Test 2: Parse agent response with JSON + code blocks
const agentResponse = `
Here's your widget:

\`\`\`json
{
  "widget": {
    "id": "test-widget",
    "name": "Test Widget",
    "icon": "🧪"
  }
}
\`\`\`

\`\`\`jsx
function Widget({ config }) {
  return React.createElement('div', null, 'Test!')
}
\`\`\`
`
const parsed = parseWidgetFromResponse(agentResponse)
console.log('Test 2 (parse):', parsed && parsed.id === 'test-widget' && parsed.code ? 'PASS' : 'FAIL')

// Test 3: Full pipeline
const fullResult = processWidgetResponse(agentResponse)
console.log('Test 3 (pipeline):', fullResult.success ? 'PASS' : 'FAIL - ' + fullResult.error)

// Test 4: Code-only response
const codeOnly = `
\`\`\`jsx
function Widget({ config }) {
  const [count, setCount] = useState(0)
  return React.createElement('div', { onClick: () => setCount(c => c + 1) }, 'Clicked: ', count)
}
\`\`\`
`
const result4 = processWidgetResponse(codeOnly)
console.log('Test 4 (code-only):', result4.success ? 'PASS' : 'FAIL - ' + result4.error)

console.log('\nAll tests done.')

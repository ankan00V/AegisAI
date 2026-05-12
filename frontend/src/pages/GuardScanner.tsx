import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { guardApi } from '../services/api'
import { ShieldAlert, ShieldCheck, ShieldX, Loader2, AlertCircle } from 'lucide-react'

interface ScanResult {
  decision: string
  confidence: number
  reasoning: string
  sanitized_prompt: string | null
  matched_patterns: string[]
}

export default function GuardScanner() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)

  const scanMutation = useMutation({
    mutationFn: (text: string) => guardApi.scan(text),
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    scanMutation.mutate(prompt)
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'allow':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <ShieldCheck className="w-4 h-4" />
            Allow
          </span>
        )
      case 'sanitize':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <ShieldAlert className="w-4 h-4" />
            Sanitize
          </span>
        )
      case 'block':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <ShieldX className="w-4 h-4" />
            Block
          </span>
        )
      default:
        return null
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'allow':
        return 'bg-green-50 border-green-200'
      case 'sanitize':
        return 'bg-orange-50 border-orange-200'
      case 'block':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.5) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guard Scanner</h1>
        <p className="text-gray-600">
          Scan prompts for injection risks using the LLM Guard module
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Prompt Input
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="guard-prompt-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter a prompt to scan
              </label>
              <textarea
                id="guard-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                placeholder="Type or paste a prompt to check for injection risks..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={scanMutation.isPending || !prompt.trim()}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {scanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Scan Prompt'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {scanMutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-medium text-red-900">Scan Failed</h3>
              </div>
              <p className="text-sm text-red-700">
                {scanMutation.error instanceof Error
                  ? scanMutation.error.message
                  : 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
          )}

          {result ? (
            <div className={`rounded-xl border p-6 ${getDecisionColor(result.decision)}`}>
              {/* Decision Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {getDecisionBadge(result.decision)}
                </div>
                <span className={`text-lg font-semibold ${getConfidenceColor(result.confidence)}`}>
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>

              {/* Reasoning */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Reasoning</h3>
                <p className="text-sm text-gray-600">{result.reasoning}</p>
              </div>

              {/* Matched Patterns */}
              {result.matched_patterns.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Matched Patterns ({result.matched_patterns.length})
                  </h3>
                  <ul className="space-y-1">
                    {result.matched_patterns.map((pattern, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <code className="bg-white/60 px-1.5 py-0.5 rounded text-xs font-mono">
                          {pattern}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Enter a Prompt to Scan
              </h3>
              <p className="text-gray-500 mt-2">
                Submit a prompt to check for injection risks, jailbreak attempts,
                and other malicious patterns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

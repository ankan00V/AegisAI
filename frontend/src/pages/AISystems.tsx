import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiSystemsApi } from '../services/api'
import { Bot, Plus, Trash2, Edit } from 'lucide-react'

interface AISystem {
  id: number
  name: string
  description: string | null
  use_case: string | null
  sector: string | null
  risk_level: string | null
  compliance_status: string
  compliance_score: number
}

export default function AISystems() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    use_case: '',
    sector: '',
  })

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['ai-systems'],
    queryFn: aiSystemsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: aiSystemsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-systems'] })
      setShowModal(false)
      setFormData({ name: '', description: '', use_case: '', sector: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: aiSystemsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-systems'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const sectors = [
    'HR Tech',
    'Finance',
    'Healthcare',
    'Education',
    'Legal',
    'Marketing',
    'Other',
  ]

  const useCases = [
    'CV Screening',
    'Candidate Ranking',
    'Performance Evaluation',
    'Credit Scoring',
    'Risk Assessment',
    'Customer Service',
    'Content Generation',
    'Other',
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Systems</h1>
          <p className="text-gray-600">Manage your AI systems for compliance tracking</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Add AI System
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : systems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No AI systems yet</h3>
          <p className="text-gray-500 mt-1">
            Add your first AI system to start tracking compliance
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Add AI System
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {systems.map((system: AISystem) => (
            <div
              key={system.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <Bot className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{system.name}</h3>
                    {system.description && (
                      <p className="text-gray-600 text-sm mt-1">{system.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {system.sector && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {system.sector}
                        </span>
                      )}
                      {system.use_case && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {system.use_case}
                        </span>
                      )}
                      {system.risk_level && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            system.risk_level === 'high'
                              ? 'bg-red-100 text-red-700'
                              : system.risk_level === 'limited'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {system.risk_level} risk
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(system.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Compliance Progress */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Compliance Score</span>
                  <span className="font-medium">{system.compliance_score}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      system.compliance_score >= 80
                        ? 'bg-green-500'
                        : system.compliance_score >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${system.compliance_score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add AI System
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  System Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., CV Screening AI"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Brief description of what your AI system does"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sector
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select sector...</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Use Case
                </label>
                <select
                  value={formData.use_case}
                  onChange={(e) => setFormData({ ...formData, use_case: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select use case...</option>
                  {useCases.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

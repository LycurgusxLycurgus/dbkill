// pages/visualize.js
import { useState } from 'react'
import QueryForm from '../components/QueryForm'
import ConceptVisualization from '../components/ConceptVisualization'

export default function Visualize() {
  const [visualizationData, setVisualizationData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleQuery = async (conceptIds) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId: conceptIds[0] }),
      })

      if (!res.ok) {
        throw new Error('Analysis failed')
      }

      const data = await res.json()
      setVisualizationData(data)
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to analyze concept')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Knowledge Visualization</h1>
      <QueryForm onQuery={handleQuery} />
      
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      
      {visualizationData && (
        <ConceptVisualization 
          analysisResult={visualizationData}
        />
      )}
    </div>
  )
}

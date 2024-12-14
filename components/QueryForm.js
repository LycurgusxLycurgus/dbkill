// components/QueryForm.js
import { useState, useEffect } from 'react'
import Select from 'react-select'

export default function QueryForm({ onQuery }) {
  const [concepts, setConcepts] = useState([])
  const [selectedConcept, setSelectedConcept] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const response = await fetch('/api/concepts')
        const data = await response.json()
        setConcepts(data.map(concept => ({
          value: concept.id,
          label: concept.name
        })))
        setLoading(false)
      } catch (error) {
        console.error('Error fetching concepts:', error)
        setLoading(false)
      }
    }
    fetchConcepts()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedConcept) {
      onQuery([selectedConcept.value])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select a Concept to Analyze
            </label>
            <Select
              options={concepts}
              value={selectedConcept}
              onChange={setSelectedConcept}
              className="w-full"
              placeholder="Select a concept..."
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!selectedConcept}
          >
            Analyze Concept Evolution
          </button>
        </>
      )}
    </form>
  )
}

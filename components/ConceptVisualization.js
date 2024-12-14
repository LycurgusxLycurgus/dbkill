import { useEffect, useRef } from 'react'
import { Network } from 'vis-network'

export default function ConceptVisualization({ analysisResult }) {
  const networkRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!analysisResult || !containerRef.current) return

    if (networkRef.current) {
      networkRef.current.destroy()
    }

    // Map schools to their colors
    const schoolColors = Object.fromEntries(
      analysisResult.schools.map(school => [school.name, school.color])
    )

    // Create nodes with enhanced styling
    const nodes = analysisResult.nodes.map(node => ({
      id: node.id,
      label: `${node.label}\n(${node.period})`,
      title: `${node.definition}\nSchool: ${node.school}\nImportance: ${node.importance}`, // Tooltip
      shape: node.type === 'main' ? 'box' : 'ellipse',
      color: {
        background: schoolColors[node.school] || '#97C2FC',
        border: '#2B7CE9',
        highlight: {
          background: schoolColors[node.school] || '#97C2FC',
          border: '#2B7CE9'
        }
      },
      font: {
        size: node.type === 'main' ? 20 : 16,
        bold: node.type === 'main',
        multi: true
      },
      borderWidth: node.type === 'main' ? 3 : 1,
      size: node.importance * 10 + 20, // Size based on importance
      shadow: node.type === 'main'
    }))

    // Create edges with enhanced styling
    const edges = analysisResult.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      title: edge.justification, // Tooltip
      arrows: {
        to: {
          enabled: edge.direction !== 'backward',
          type: 'arrow'
        },
        from: {
          enabled: edge.direction === 'bidirectional',
          type: 'arrow'
        }
      },
      color: {
        color: getEdgeColor(edge.type),
        highlight: '#848484',
        hover: '#848484'
      },
      dashes: edge.type === 'influence',
      width: edge.strength,
      smooth: {
        type: 'curvedCW',
        roundness: 0.2
      },
      physics: false
    }))

    // Configure network options
    const options = {
      layout: {
        hierarchical: {
          direction: 'LR', // Left to right layout
          sortMethod: 'directed',
          nodeSpacing: 200,
          levelSeparation: 300,
          parentCentralization: true,
          edgeMinimization: true,
          blockShifting: true
        }
      },
      physics: {
        enabled: false
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true
      },
      nodes: {
        margin: 10,
        borderWidth: 2,
        shadow: true
      },
      edges: {
        smooth: true,
        shadow: true
      }
    }

    // Create network
    networkRef.current = new Network(
      containerRef.current,
      { nodes, edges },
      options
    )

    // Add event listeners for better interaction
    networkRef.current.on('click', function(params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]
        const node = analysisResult.nodes.find(n => n.id === nodeId)
        if (node) {
          console.log('Node clicked:', node)
        }
      }
    })
  }, [analysisResult])

  return (
    <div className="flex flex-col gap-4">
      <div 
        ref={containerRef} 
        className="w-full border rounded-lg shadow-inner bg-white"
        style={{ height: '700px' }}
      />
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-bold mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-4">
          {analysisResult?.schools?.map(school => (
            <div key={school.name} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: school.color }}
              />
              <span>{school.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getEdgeColor(type) {
  switch (type) {
    case 'evolution': return '#2B7CE9'
    case 'influence': return '#848484'
    case 'critique': return '#FF4444'
    case 'support': return '#4CAF50'
    case 'translation': return '#9C27B0'
    default: return '#848484'
  }
} 
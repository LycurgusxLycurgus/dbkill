// components/Visualization.js
import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

export default function Visualization({ labels, connections }) {
  const chartRef = useRef(null)

  useEffect(() => {
    if (!labels || !connections) return

    const ctx = chartRef.current.getContext('2d')

    // Prepare data for Chart.js (e.g., force-directed graph can be implemented with plugins or use D3.js for better flexibility)
    // For simplicity, we'll use a bubble chart as a placeholder

    const data = {
      labels: labels.map(l => l.label),
      datasets: [
        {
          label: 'Concepts',
          data: labels.map(() => ({ x: Math.random() * 100, y: Math.random() * 100, r: 10 })),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    }

    new Chart(ctx, {
      type: 'bubble',
      data: data,
      options: {
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    })
  }, [labels, connections])

  return <canvas ref={chartRef}></canvas>
}

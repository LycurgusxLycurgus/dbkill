// pages/api/cluster.js
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    // Fetch all vectors
    const { data: vectors, error } = await supabase
      .from('vectors')
      .select('id, label_id, vector')

    if (error) {
      console.error(error)
      return res.status(500).json({ message: 'Error fetching vectors' })
    }

    // Perform clustering (simple cosine similarity for demonstration)
    // For POC, we'll just group similar vectors based on a threshold

    const clusters = []
    const used = new Set()

    for (let i = 0; i < vectors.length; i++) {
      if (used.has(vectors[i].id)) continue

      const cluster = [vectors[i].label_id]
      used.add(vectors[i].id)

      for (let j = i + 1; j < vectors.length; j++) {
        if (used.has(vectors[j].id)) continue

        const similarity = cosineSimilarity(vectors[i].vector, vectors[j].vector)
        if (similarity > 0.8) { // Threshold can be adjusted
          cluster.push(vectors[j].label_id)
          used.add(vectors[j].id)
        }
      }

      clusters.push(cluster)
    }

    // Insert connections based on clusters
    for (const cluster of clusters) {
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          await supabase.from('connections').insert([
            {
              label1_id: cluster[i],
              label2_id: cluster[j],
              similarity_score: 1, // Placeholder, can be updated with actual similarity
            },
          ])
        }
      }
    }

    res.status(200).json({ message: 'Clustering completed', clusters })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error during clustering' })
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((acc, val, idx) => acc + val * vecB[idx], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

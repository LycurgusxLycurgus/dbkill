// pages/api/query.js
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { conceptIds } = req.body

  try {
    // Fetch selected concepts
    const { data: concepts, error: conceptsError } = await supabase
      .from('concepts')
      .select('*')
      .in('id', conceptIds)

    // Fetch relationships where either source or target is in selected concepts
    const { data: relationships, error: relError } = await supabase
      .from('relationships')
      .select('*')
      .or(`source_concept_id.in.(${conceptIds.join(',')}),target_concept_id.in.(${conceptIds.join(',')})`)

    if (conceptsError || relError) {
      console.error('Data fetch error:', { conceptsError, relError })
      return res.status(500).json({ message: 'Error fetching related data' })
    }

    // Create a simple similarity score (1.0 for selected concepts)
    const similarityScores = conceptIds.reduce((acc, id) => {
      acc[id] = 1.0
      return acc
    }, {})

    res.status(200).json({
      concepts,
      relationships,
      similarityScores
    })
  } catch (err) {
    console.error('Query processing error:', err)
    res.status(500).json({ message: 'Error processing query' })
  }
}

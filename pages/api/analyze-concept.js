import { openai } from '../../lib/openai'
import { supabase } from '../../lib/supabaseClient'
import { embeddings } from '../../lib/embeddings'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { conceptId } = req.body

  try {
    // 1. Get the main concept
    const { data: mainConcept, error: conceptError } = await supabase
      .from('concepts')
      .select('*')
      .eq('id', conceptId)
      .single()

    if (conceptError) throw conceptError

    // 2. Get its vector
    const { data: vectorData, error: vectorError } = await supabase
      .from('concept_vectors')
      .select('vector')
      .eq('concept_id', conceptId)
      .single()

    if (vectorError) throw vectorError

    // 3. Find similar concepts using vector similarity
    const { data: similarConcepts, error: similarError } = await supabase
      .rpc('match_concepts', {
        query_embedding: vectorData.vector,
        match_threshold: 0.7,
        match_count: 5
      })

    if (similarError) {
      console.error('Similar concepts error:', similarError)
      throw similarError
    }

    // Make sure we have valid concept IDs before proceeding
    if (!similarConcepts || similarConcepts.length === 0) {
      // If no similar concepts found, just return analysis with main concept
      const completion = await openai.chat.completions.create({
        model: 'hf:meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          {
            role: 'system',
            content: `You are a concept genealogy expert specialized in analyzing the evolution and relationships between concepts. Given a main concept and its related concepts, create a detailed genealogical analysis. Return a JSON response in exactly this format without any additional text or formatting:

{
  "nodes": [
    {
      "id": "unique_string",
      "label": "concept name",
      "type": "main|related|influence|theoretical|methodological",
      "school": "school of thought name",
      "period": "historical period or year",
      "definition": "brief definition",
      "importance": 1-5 scale number
    }
  ],
  "edges": [
    {
      "from": "source_node_id",
      "to": "target_node_id",
      "type": "evolution|influence|critique|support|translation",
      "direction": "forward|backward|bidirectional",
      "strength": 1-5 scale number,
      "justification": "brief explanation of the relationship"
    }
  ],
  "schools": [
    {
      "name": "school name",
      "color": "hex color code",
      "description": "brief description"
    }
  ],
  "timeline": {
    "start": "earliest year",
    "end": "latest year",
    "periods": [
      {
        "name": "period name",
        "start": "year",
        "end": "year",
        "significance": "brief explanation"
      }
    ]
  }
}

Important: Return ONLY the raw JSON object. Do not wrap it in code fences or add any other text or formatting.`
          },
          {
            role: 'user',
            content: `Analyze these concepts and create a genealogical visualization structure. Return ONLY the JSON response:\n\nMain concept: ${JSON.stringify(mainConcept)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      })

      console.log('Raw OpenAI response:', JSON.stringify(completion, null, 2))
      const analysisResult = JSON.parse(completion.choices[0].message.content)
      console.log('Parsed analysis:', JSON.stringify(analysisResult, null, 2))

      return res.status(200).json(analysisResult)
    }

    // 4. Get full concept details for similar concepts
    const conceptIds = similarConcepts.map(sc => sc.concept_id)
    console.log('Fetching concepts with IDs:', conceptIds)
    
    const { data: relatedConcepts, error: relatedError } = await supabase
      .from('concepts')
      .select('*')
      .in('id', conceptIds)

    if (relatedError) throw relatedError

    // 5. Use OpenAI to analyze concept evolution (using same format as process.js)
    const completion = await openai.chat.completions.create({
      model: 'hf:meta-llama/Llama-3.3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: `You are a concept genealogy expert specialized in analyzing the evolution and relationships between concepts. Given a main concept and its related concepts, create a detailed genealogical analysis. Return a JSON response in exactly this format without any additional text or formatting:

{
  "nodes": [
    {
      "id": "unique_string",
      "label": "concept name",
      "type": "main|related|influence|theoretical|methodological",
      "school": "school of thought name",
      "period": "historical period or year",
      "definition": "brief definition",
      "importance": 1-5 scale number
    }
  ],
  "edges": [
    {
      "from": "source_node_id",
      "to": "target_node_id",
      "type": "evolution|influence|critique|support|translation",
      "direction": "forward|backward|bidirectional",
      "strength": 1-5 scale number,
      "justification": "brief explanation of the relationship"
    }
  ],
  "schools": [
    {
      "name": "school name",
      "color": "hex color code",
      "description": "brief description"
    }
  ],
  "timeline": {
    "start": "earliest year",
    "end": "latest year",
    "periods": [
      {
        "name": "period name",
        "start": "year",
        "end": "year",
        "significance": "brief explanation"
      }
    ]
  }
}

Important: Return ONLY the raw JSON object. Do not wrap it in code fences or add any other text or formatting.`
        },
        {
          role: 'user',
          content: `Analyze these concepts and create a genealogical visualization structure. Return ONLY the JSON response:\n\nMain concept: ${JSON.stringify(mainConcept)}\nRelated concepts: ${JSON.stringify(relatedConcepts)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    console.log('Raw OpenAI response:', JSON.stringify(completion, null, 2))
    const analysisResult = JSON.parse(completion.choices[0].message.content)
    console.log('Parsed analysis:', JSON.stringify(analysisResult, null, 2))

    res.status(200).json(analysisResult)
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({ message: 'Error analyzing concept', error: error.message })
  }
} 
// pages/api/process.js
import { supabase } from '../../lib/supabaseClient'
import { openai } from '../../lib/openai'
import { embeddings } from '../../lib/huggingfaceClient'

export default async function handler(req, res) {
  console.log('Process endpoint hit with body:', req.body)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { pdfId } = req.body
  if (!pdfId) {
    return res.status(400).json({ message: 'No PDF ID provided' })
  }

  // Convert pdfId to integer
  const numericPdfId = parseInt(pdfId, 10)
  if (isNaN(numericPdfId)) {
    return res.status(400).json({ message: 'Invalid PDF ID format' })
  }

  try {
    // Initial database check with correct parameter name
    const { data: tableExists, error: tableError } = await supabase
      .rpc('check_tables_exist', {
        input_tables: ['pdfs', 'concepts', 'relationships', 'frameworks', 'concept_vectors']
      });
    
    console.log('Database check:', {
      tables: tableExists,
      error: tableError
    });

    if (tableError) {
      throw new Error(`Database setup error: ${tableError.message}`);
    }

    // Verify each table exists
    const missingTables = Object.entries(tableExists)
      .filter(([_, exists]) => !exists)
      .map(([table]) => table);

    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    // Fetch PDF content
    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .select('content')
      .eq('id', numericPdfId)
      .single()

    if (pdfError) {
      console.error('Error fetching PDF:', pdfError)
      return res.status(500).json({ message: 'Error fetching PDF content' })
    }

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' })
    }

    // Get analysis from OpenAI
    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'hf:meta-llama/Llama-3.3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: `You are a research analysis expert specialized in extracting key concepts and their relationships from academic texts. Analyze the provided text and return a JSON response in exactly this format without any additional text or formatting:

{
  "main_concepts": [
    {
      "name": "concept name",
      "definition": "brief definition"
    }
  ],
  "relationships": [
    {
      "source": "concept1",
      "target": "concept2",
      "type": "citation|semantic|empirical",
      "justification": "brief explanation"
    }
  ],
  "theoretical_framework": [
    {
      "name": "framework name",
      "assumptions": "key assumptions"
    }
  ],
  "methodological_approaches": [
    {
      "name": "approach name",
      "characteristics": "key characteristics"
    }
  ],
  "conflicts_and_supports": [
    {
      "type": "conflict|support",
      "concepts": ["concept1", "concept2"],
      "explanation": "brief explanation"
    }
  ]
}
  
Important: Return ONLY the raw JSON object. Do not wrap it in code fences or add any other text or formatting.`
        },
        {
          role: 'user',
          content: `Analyze this text and return ONLY the JSON response, Do not include markdown code fences or any other formatting:\n\n${pdf.content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    console.log('Raw OpenAI response:', JSON.stringify(completion, null, 2));
    const parsedAnalysis = JSON.parse(completion.choices[0].message.content)
    console.log('Parsed analysis:', JSON.stringify(parsedAnalysis, null, 2));
    
    // Track insertion results
    const results = {
      concepts: { success: 0, failed: 0, ids: {} },
      relationships: { success: 0, failed: 0 },
      frameworks: { success: 0, failed: 0 },
      vectors: { success: 0, failed: 0 }
    }

    // Insert concepts first and collect their IDs
    for (const concept of parsedAnalysis.main_concepts) {
      try {
        console.log(`Inserting concept: ${concept.name}`);
        const { data, error } = await supabase
          .from('concepts')
          .insert({
            pdf_id: numericPdfId,
            name: concept.name,
            definition: concept.definition
          })
          .select()
          .single()

        if (error) {
          console.error(`Error inserting concept ${concept.name}:`, error);
          throw error;
        }
        console.log(`Successfully inserted concept: ${concept.name} with ID: ${data.id}`);
        results.concepts.success++
        results.concepts.ids[concept.name] = data.id
      } catch (err) {
        console.error(`Failed to insert concept: ${concept.name}`, err)
        results.concepts.failed++
      }
    }

    // Insert relationships using concept IDs
    for (const rel of parsedAnalysis.relationships) {
      try {
        if (results.concepts.ids[rel.source] && results.concepts.ids[rel.target]) {
          const { error } = await supabase
            .from('relationships')
            .insert({
              pdf_id: numericPdfId,
              source_concept_id: results.concepts.ids[rel.source],
              target_concept_id: results.concepts.ids[rel.target],
              relationship_type: rel.type,
              justification: rel.justification
            })

          if (error) throw error
          results.relationships.success++
        }
      } catch (err) {
        console.error(`Failed to insert relationship: ${rel.source} -> ${rel.target}`, err)
        results.relationships.failed++
      }
    }

    // Insert frameworks
    const frameworks = [
      ...parsedAnalysis.theoretical_framework.map(tf => ({
        ...tf,
        framework_type: 'theoretical'
      })),
      ...parsedAnalysis.methodological_approaches.map(ma => ({
        name: ma.name,
        assumptions: ma.characteristics,
        framework_type: 'methodological'
      }))
    ]

    for (const framework of frameworks) {
      try {
        const { error } = await supabase
          .from('frameworks')
          .insert({
            pdf_id: numericPdfId,
            name: framework.name,
            assumptions: framework.assumptions,
            framework_type: framework.framework_type
          })

        if (error) throw error
        results.frameworks.success++
      } catch (err) {
        console.error(`Failed to insert framework: ${framework.name}`, err)
        results.frameworks.failed++
      }
    }

    // Generate and store vectors for concepts
    for (const [conceptName, conceptId] of Object.entries(results.concepts.ids)) {
      try {
        // Generate embedding using HuggingFace
        const embeddingVector = await embeddings.embedQuery(
          `${conceptName}: ${parsedAnalysis.main_concepts.find(c => c.name === conceptName).definition}`
        );

        const { error } = await supabase
          .from('concept_vectors')
          .insert({
            concept_id: conceptId,
            vector: embeddingVector
          })

        if (error) {
          console.error(`Error inserting vector for concept ${conceptName}:`, error);
          throw error;
        }
        console.log(`Successfully generated and stored vector for concept: ${conceptName}`);
        results.vectors.success++
      } catch (err) {
        console.error(`Vector generation failed for concept: ${conceptName}`, err)
        results.vectors.failed++
      }
    }

    res.status(200).json({
      message: 'Document processed successfully',
      results
    })
  } catch (err) {
    console.error('Processing error:', err)
    res.status(500).json({
      message: 'Error processing document',
      error: err.message
    })
  }
}

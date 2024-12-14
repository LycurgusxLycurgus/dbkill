import { HfInference } from '@huggingface/inference'

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export const embeddings = {
  async embedQuery(text) {
    try {
      const response = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text,
      })
      return response
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw error
    }
  }
} 
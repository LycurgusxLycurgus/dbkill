// lib/openai.js
import OpenAI from 'openai'

// Create a single instance of the OpenAI client with GLHF configuration
export const openai = new OpenAI({
  apiKey: process.env.GLHF_API_KEY,
  baseURL: "https://glhf.chat/api/openai/v1",
})

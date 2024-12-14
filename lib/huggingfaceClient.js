import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

export const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY, // Your HF key
  model: "sentence-transformers/distilbert-base-nli-mean-tokens" // A good default model
}); 
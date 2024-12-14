# PDF Knowledge Graph Extraction Tool

## Overview
This project is a Proof of Concept (PoC) for extracting and visualizing knowledge from PDF documents using AI, LLMs, and RAG (Retrieval-Augmented Generation) techniques.

## Features
- PDF Upload and Parsing
- Concept Extraction
- Relationship Mapping
- Knowledge Graph Visualization
- AI-Powered Analysis

## Tech Stack
- Frontend: Next.js
- Backend: Supabase
- AI/ML: 
  - OpenAI
  - Hugging Face
  - LangChain
- Database: PostgreSQL with Vector Extension

## Prerequisites
- Node.js (v18+)
- npm
- Supabase Account
- OpenAI API Key
- Hugging Face API Key

## Environment Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/pdf-knowledge-graph.git
cd pdf-knowledge-graph
```

2. Install Dependencies
```bash
npm install
```

3. Configure Environment Variables
Create a `.env.local` file with:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Hugging Face
HUGGINGFACEHUB_API_KEY=your_huggingface_api_key
```

## Database Setup
1. Initialize Supabase
```bash
npx supabase init
npx supabase login
npx supabase db push
```

## Running the Application
- Development Mode
```bash
npm run dev
```

- Production Build
```bash
npm run build
npm start
```

## Key Components
- `/pages/api/upload.js`: PDF Upload Handler
- `/pages/api/process.js`: AI-Powered PDF Analysis
- `/lib/supabaseClient.js`: Supabase Client Configuration
- `/supabase/migrations/`: Database Migration Scripts

## Workflow
1. Upload PDF
2. Extract Concepts
3. Identify Relationships
4. Generate Knowledge Graph
5. Visualize Insights

## Contributing
1. Fork the Repository
2. Create Feature Branch
3. Commit Changes
4. Push to Branch
5. Create Pull Request

## License
MIT License

## Troubleshooting
- Ensure all API keys are correctly configured
- Check Supabase connection
- Verify PostgreSQL vector extension is enabled

## Future Improvements
- Enhanced AI Models
- More Robust Relationship Detection
- Interactive Visualization
- Multi-PDF Analysis

## Contact
[Your Name/Email]

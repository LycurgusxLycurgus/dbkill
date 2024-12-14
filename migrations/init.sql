-- migrations/init.sql

-- First, drop existing tables in correct order
DROP TABLE IF EXISTS concept_vectors;
DROP TABLE IF EXISTS frameworks;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS concepts;
DROP TABLE IF EXISTS pdfs;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create base tables
CREATE TABLE pdfs (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Disable RLS
ALTER TABLE pdfs DISABLE ROW LEVEL SECURITY;

-- Simplified tables with separate concerns
CREATE TABLE concepts (
  id SERIAL PRIMARY KEY,
  pdf_id INTEGER REFERENCES pdfs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  definition TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE concepts DISABLE ROW LEVEL SECURITY;

CREATE TABLE relationships (
  id SERIAL PRIMARY KEY,
  pdf_id INTEGER REFERENCES pdfs(id) ON DELETE CASCADE,
  source_concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  target_concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE relationships DISABLE ROW LEVEL SECURITY;

CREATE TABLE frameworks (
  id SERIAL PRIMARY KEY,
  pdf_id INTEGER REFERENCES pdfs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  assumptions TEXT,
  framework_type TEXT NOT NULL CHECK (framework_type IN ('theoretical', 'methodological')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE frameworks DISABLE ROW LEVEL SECURITY;

CREATE TABLE concept_vectors (
  id SERIAL PRIMARY KEY,
  concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  vector vector(768) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE concept_vectors DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_concepts_pdf_id ON concepts(pdf_id);
CREATE INDEX idx_relationships_pdf_id ON relationships(pdf_id);
CREATE INDEX idx_frameworks_pdf_id ON frameworks(pdf_id);

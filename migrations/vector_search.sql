-- migrations/vector_search.sql

CREATE OR REPLACE FUNCTION vector_search(
  query_vector vector,
  similarity_threshold float,
  match_count int
)
RETURNS TABLE(label_id int, similarity float) AS $$
BEGIN
  RETURN QUERY
  SELECT
    label_id,
    (vector <=> query_vector) AS similarity
  FROM vectors
  WHERE vector <=> query_vector < similarity_threshold
  ORDER BY vector <=> query_vector
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

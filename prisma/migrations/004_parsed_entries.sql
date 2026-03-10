CREATE TABLE parsed_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
  parsed_json JSONB NOT NULL,
  alignment_score INT NOT NULL,
  activities JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id),
  raw_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


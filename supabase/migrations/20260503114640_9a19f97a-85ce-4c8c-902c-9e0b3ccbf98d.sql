
-- Storage bucket for datasets
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

-- Public read for now (no auth in app yet) — we use random UUID/hash paths so unguessable
CREATE POLICY "Public read datasets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'datasets');

CREATE POLICY "Public upload datasets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'datasets');

CREATE POLICY "Public delete datasets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'datasets');

-- Datasets registry
CREATE TABLE public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_ext TEXT NOT NULL,
  row_count INTEGER,
  col_count INTEGER,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read datasets table" ON public.datasets FOR SELECT USING (true);
CREATE POLICY "Public insert datasets table" ON public.datasets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete datasets table" ON public.datasets FOR DELETE USING (true);

-- Cached precomputed profiles, keyed by file hash
CREATE TABLE public.dataset_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash TEXT NOT NULL UNIQUE REFERENCES public.datasets(file_hash) ON DELETE CASCADE,
  profile JSONB NOT NULL,
  correlations JSONB,
  advanced JSONB,
  health_score INTEGER,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dataset_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.dataset_profiles FOR SELECT USING (true);
CREATE POLICY "Public write profiles" ON public.dataset_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.dataset_profiles FOR UPDATE USING (true);

-- Job queue for long-running compute (model training, etc.)
CREATE TABLE public.compute_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash TEXT REFERENCES public.datasets(file_hash) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  params JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compute_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read jobs" ON public.compute_jobs FOR SELECT USING (true);
CREATE POLICY "Public write jobs" ON public.compute_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update jobs" ON public.compute_jobs FOR UPDATE USING (true);

CREATE INDEX idx_compute_jobs_status ON public.compute_jobs(status, created_at);
CREATE INDEX idx_datasets_hash ON public.datasets(file_hash);

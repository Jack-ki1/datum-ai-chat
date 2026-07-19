
DELETE FROM public.dataset_profiles;
DELETE FROM public.compute_jobs;
DELETE FROM public.datasets;

ALTER TABLE public.dataset_profiles DROP CONSTRAINT IF EXISTS dataset_profiles_file_hash_fkey;
ALTER TABLE public.compute_jobs DROP CONSTRAINT IF EXISTS compute_jobs_file_hash_fkey;

ALTER TABLE public.datasets DROP CONSTRAINT IF EXISTS datasets_file_hash_key;

ALTER TABLE public.datasets
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS datasets_file_hash_user_id_key
  ON public.datasets (file_hash, user_id);

CREATE INDEX IF NOT EXISTS datasets_user_id_idx ON public.datasets(user_id);

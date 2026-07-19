
-- Ensure user_id NOT NULL with default (column was added earlier)
ALTER TABLE public.datasets
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

-- Drop any old permissive policies
DROP POLICY IF EXISTS "Public read datasets" ON public.datasets;
DROP POLICY IF EXISTS "Public insert datasets" ON public.datasets;
DROP POLICY IF EXISTS "Public update datasets" ON public.datasets;
DROP POLICY IF EXISTS "Public delete datasets" ON public.datasets;
DROP POLICY IF EXISTS "datasets_all" ON public.datasets;
DROP POLICY IF EXISTS "Allow all" ON public.datasets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.datasets;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.datasets;

DROP POLICY IF EXISTS "Public read dataset_profiles" ON public.dataset_profiles;
DROP POLICY IF EXISTS "Public insert dataset_profiles" ON public.dataset_profiles;
DROP POLICY IF EXISTS "Public update dataset_profiles" ON public.dataset_profiles;
DROP POLICY IF EXISTS "Public delete dataset_profiles" ON public.dataset_profiles;
DROP POLICY IF EXISTS "dataset_profiles_all" ON public.dataset_profiles;

DROP POLICY IF EXISTS "Public read compute_jobs" ON public.compute_jobs;
DROP POLICY IF EXISTS "Public insert compute_jobs" ON public.compute_jobs;
DROP POLICY IF EXISTS "Public update compute_jobs" ON public.compute_jobs;
DROP POLICY IF EXISTS "Public delete compute_jobs" ON public.compute_jobs;
DROP POLICY IF EXISTS "compute_jobs_all" ON public.compute_jobs;

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compute_jobs ENABLE ROW LEVEL SECURITY;

-- Grants (authenticated only — service_role bypasses RLS anyway)
REVOKE ALL ON public.datasets FROM anon;
REVOKE ALL ON public.dataset_profiles FROM anon;
REVOKE ALL ON public.compute_jobs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dataset_profiles TO authenticated;
GRANT ALL ON public.dataset_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compute_jobs TO authenticated;
GRANT ALL ON public.compute_jobs TO service_role;

-- datasets: owner-only
CREATE POLICY "datasets_owner_select" ON public.datasets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "datasets_owner_insert" ON public.datasets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "datasets_owner_update" ON public.datasets
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "datasets_owner_delete" ON public.datasets
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- dataset_profiles: allowed only if the caller owns a dataset with the same file_hash
CREATE POLICY "dataset_profiles_owner_select" ON public.dataset_profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = dataset_profiles.file_hash AND d.user_id = auth.uid())
  );
CREATE POLICY "dataset_profiles_owner_insert" ON public.dataset_profiles
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = dataset_profiles.file_hash AND d.user_id = auth.uid())
  );
CREATE POLICY "dataset_profiles_owner_update" ON public.dataset_profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = dataset_profiles.file_hash AND d.user_id = auth.uid())
  );
CREATE POLICY "dataset_profiles_owner_delete" ON public.dataset_profiles
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = dataset_profiles.file_hash AND d.user_id = auth.uid())
  );

-- compute_jobs: same pattern
CREATE POLICY "compute_jobs_owner_select" ON public.compute_jobs
  FOR SELECT TO authenticated USING (
    file_hash IS NULL OR EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = compute_jobs.file_hash AND d.user_id = auth.uid())
  );
CREATE POLICY "compute_jobs_owner_insert" ON public.compute_jobs
  FOR INSERT TO authenticated WITH CHECK (
    file_hash IS NULL OR EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = compute_jobs.file_hash AND d.user_id = auth.uid())
  );
CREATE POLICY "compute_jobs_owner_update" ON public.compute_jobs
  FOR UPDATE TO authenticated USING (
    file_hash IS NULL OR EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = compute_jobs.file_hash AND d.user_id = auth.uid())
  );
CREATE POLICY "compute_jobs_owner_delete" ON public.compute_jobs
  FOR DELETE TO authenticated USING (
    file_hash IS NULL OR EXISTS (SELECT 1 FROM public.datasets d WHERE d.file_hash = compute_jobs.file_hash AND d.user_id = auth.uid())
  );

-- Storage: datasets bucket -- objects are stored under `<user_id>/<file_hash>.json`
DROP POLICY IF EXISTS "Public read datasets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public write datasets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public delete datasets bucket" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_public_select" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_public_update" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_public_delete" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "datasets_bucket_owner_delete" ON storage.objects;

CREATE POLICY "datasets_bucket_owner_select" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "datasets_bucket_owner_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "datasets_bucket_owner_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "datasets_bucket_owner_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text
  );

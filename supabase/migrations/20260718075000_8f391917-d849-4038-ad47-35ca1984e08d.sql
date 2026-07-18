
-- Drop overly permissive policies on datasets
DROP POLICY IF EXISTS "Public delete datasets table" ON public.datasets;
DROP POLICY IF EXISTS "Public insert datasets table" ON public.datasets;
DROP POLICY IF EXISTS "Public read datasets table" ON public.datasets;

-- Drop overly permissive policies on dataset_profiles
DROP POLICY IF EXISTS "Public read profiles" ON public.dataset_profiles;
DROP POLICY IF EXISTS "Public update profiles" ON public.dataset_profiles;
DROP POLICY IF EXISTS "Public write profiles" ON public.dataset_profiles;

-- Drop overly permissive policies on compute_jobs
DROP POLICY IF EXISTS "Public read jobs" ON public.compute_jobs;
DROP POLICY IF EXISTS "Public update jobs" ON public.compute_jobs;
DROP POLICY IF EXISTS "Public write jobs" ON public.compute_jobs;

-- Revoke any anon/authenticated grants; service_role keeps full access (edge functions)
REVOKE ALL ON public.datasets FROM anon, authenticated;
REVOKE ALL ON public.dataset_profiles FROM anon, authenticated;
REVOKE ALL ON public.compute_jobs FROM anon, authenticated;
GRANT ALL ON public.datasets TO service_role;
GRANT ALL ON public.dataset_profiles TO service_role;
GRANT ALL ON public.compute_jobs TO service_role;

-- RLS remains enabled; with no policies, anon/authenticated are fully denied.
-- service_role bypasses RLS and is used by all edge functions.

-- Storage bucket: drop public policies. Bucket is already private (public=false).
DROP POLICY IF EXISTS "Public read datasets" ON storage.objects;
DROP POLICY IF EXISTS "Public upload datasets" ON storage.objects;
DROP POLICY IF EXISTS "Public delete datasets" ON storage.objects;
-- No replacement policies — only service_role (edge functions) can access the bucket.

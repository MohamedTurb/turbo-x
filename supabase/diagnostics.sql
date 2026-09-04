-- =====================================================================
-- TURBOX RLS / SETUP DIAGNOSTICS
-- Run these one at a time in the Supabase SQL Editor to debug
-- authentication, roles, or Row Level Security issues.
-- =====================================================================

-- 1. List every profile currently in the database.
select id, full_name, role, created_at
from public.profiles
order by created_at desc;

-- 2. List only admin profiles (useful to confirm your admin exists).
select id, full_name, role, created_at
from public.profiles
where role = 'admin';

-- 3. List only student profiles.
select id, full_name, role, created_at
from public.profiles
where role = 'student';

-- 4. Confirm the is_admin() helper function exists and its definition.
select proname, prosecdef as is_security_definer, proconfig
from pg_proc
where proname = 'is_admin';

-- 5. List all RLS policies on TurboX tables.
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 6. Confirm RLS is actually enabled on every TurboX table.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in
  ('profiles', 'quizzes', 'questions', 'quiz_attempts', 'assignments', 'submissions');

-- 7. Check grants on the is_admin() function (authenticated should have EXECUTE).
select grantee, privilege_type
from information_schema.routine_privileges
where routine_name = 'is_admin';

-- 8. Quick sanity check: published quizzes visible to students.
select id, title, published, created_at
from public.quizzes
where published = true
order by created_at desc;

-- 9. Count of questions per quiz (useful when building a quiz card list).
select q.id, q.title, count(qs.id) as question_count
from public.quizzes q
left join public.questions qs on qs.quiz_id = q.id
group by q.id, q.title
order by q.id;

-- 10. Recent quiz attempts, newest first (admin-only data in the app).
select qa.id, p.full_name, qz.title, qa.score, qa.total_points, qa.percentage, qa.created_at
from public.quiz_attempts qa
join public.profiles p on p.id = qa.student_id
join public.quizzes qz on qz.id = qa.quiz_id
order by qa.created_at desc
limit 50;

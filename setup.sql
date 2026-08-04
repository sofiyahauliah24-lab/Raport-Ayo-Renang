-- Skrip Inisialisasi Database Supabase untuk AYO RENANG

-- 1. TABEL PROFIL (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'admin', 'coach')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL PESERTA (Students)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  photo_url TEXT,
  birth_date DATE,
  age INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL SESI LATIHAN (Training Sessions)
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  training_date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL EVALUASI (Evaluations)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  training_material TEXT NOT NULL,
  evaluation_result TEXT NOT NULL CHECK (evaluation_result IN ('Belum Bisa', 'Mulai Berkembang', 'Berkembang', 'Sangat Baik')),
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TRIGGER UNTUK OTOMATIS MEMBUAT PROFIL SETELAH SIGN UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User Baru'),
    coalesce(new.raw_user_meta_data->>'role', 'parent')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Pemicu pendaftaran
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. FUNGSI PEMBANTU UNTUK MENGAMBIL ROLE USER (Aman dari rekursi RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- 8. KEBIJAKAN (POLICIES) RLS

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;
CREATE POLICY "Admins have full access on profiles" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'admin');

-- Students
DROP POLICY IF EXISTS "View students based on role" ON public.students;
CREATE POLICY "View students based on role" ON public.students
  FOR SELECT USING (
    parent_id = auth.uid() 
    OR public.get_my_role() IN ('coach', 'admin')
  );

DROP POLICY IF EXISTS "Admin and coach can manage students" ON public.students;
CREATE POLICY "Admin and coach can manage students" ON public.students
  FOR ALL USING (public.get_my_role() IN ('coach', 'admin'));

-- Training Sessions
DROP POLICY IF EXISTS "View training sessions" ON public.training_sessions;
CREATE POLICY "View training sessions" ON public.training_sessions
  FOR SELECT USING (
    public.get_my_role() IN ('coach', 'admin')
    OR EXISTS (
      SELECT 1 FROM public.students 
      WHERE students.id = training_sessions.student_id 
      AND students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Manage training sessions" ON public.training_sessions;
CREATE POLICY "Manage training sessions" ON public.training_sessions
  FOR ALL USING (public.get_my_role() IN ('coach', 'admin'));

-- Evaluations
DROP POLICY IF EXISTS "View evaluations" ON public.evaluations;
CREATE POLICY "View evaluations" ON public.evaluations
  FOR SELECT USING (
    public.get_my_role() IN ('coach', 'admin')
    OR EXISTS (
      SELECT 1 FROM public.students 
      WHERE students.id = evaluations.student_id 
      AND students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Manage evaluations" ON public.evaluations;
CREATE POLICY "Manage evaluations" ON public.evaluations
  FOR ALL USING (public.get_my_role() IN ('coach', 'admin'));

-- 9. HAK AKSES (GRANT PERMISSIONS) UNTUK ROLE anon DAN authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- 10. BUCKET STORAGE UNTUK FOTO PESERTA (OPSIONAL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Student Photos Access" ON storage.objects;
CREATE POLICY "Public Student Photos Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-photos');

DROP POLICY IF EXISTS "Authenticated users can upload student photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload student photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

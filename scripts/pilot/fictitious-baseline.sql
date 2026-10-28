-- SOMENTE banco PostgreSQL local vazio dna_p4_ficticio. NAO usar em Supabase/producao.
BEGIN;
DO $$ BEGIN
 IF current_database()<>'dna_p4_ficticio' OR EXISTS(SELECT 1 FROM pg_tables WHERE schemaname IN ('public','auth','dna_private')) THEN RAISE EXCEPTION 'Requires empty disposable local fixture database';END IF;
END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN;END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN;END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN;END IF;
END $$;
CREATE SCHEMA auth;CREATE SCHEMA dna_private;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id),not_after timestamptz);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT COALESCE(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (auth.jwt()->>'sub')::uuid $$;
GRANT USAGE ON SCHEMA auth,dna_private TO authenticated,service_role;
CREATE TABLE public.institutions(id uuid PRIMARY KEY,name text NOT NULL,active boolean NOT NULL DEFAULT true);
CREATE TABLE public.user_profiles(id uuid PRIMARY KEY REFERENCES auth.users(id),display_name text,active boolean NOT NULL DEFAULT true);
CREATE TABLE public.platform_owners(user_id uuid PRIMARY KEY REFERENCES public.user_profiles(id),active boolean NOT NULL DEFAULT true);
CREATE TABLE public.institution_memberships(id uuid PRIMARY KEY,institution_id uuid REFERENCES public.institutions(id),user_id uuid REFERENCES public.user_profiles(id),role_code text,active boolean DEFAULT true,scope_pending boolean DEFAULT false,UNIQUE(id,institution_id));
CREATE TABLE public.user_permission_grants(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),membership_id uuid,institution_id uuid,resource text,action text,scope_type text,allowed boolean,FOREIGN KEY(membership_id,institution_id) REFERENCES public.institution_memberships(id,institution_id));
CREATE TABLE public.access_audit_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),institution_id uuid REFERENCES public.institutions(id),actor_user_id uuid REFERENCES public.user_profiles(id),action text,resource_type text,resource_id uuid,reason text,metadata jsonb,created_at timestamptz DEFAULT now());
CREATE TABLE public.units_v2(id uuid PRIMARY KEY,name text,active boolean NOT NULL DEFAULT true,monthly_credit_limit integer DEFAULT 0,credits_used integer DEFAULT 0);
CREATE TABLE public.questionnaires(id uuid PRIMARY KEY);
CREATE TABLE public.questionnaire_profiles(id uuid PRIMARY KEY,questionnaire_id uuid REFERENCES public.questionnaires(id),code text,UNIQUE(questionnaire_id,code));
CREATE TABLE public.questions(id uuid PRIMARY KEY,questionnaire_id uuid REFERENCES public.questionnaires(id));
CREATE TABLE public.alternatives(id uuid PRIMARY KEY,question_id uuid REFERENCES public.questions(id));
CREATE TABLE public.participants_v2(id uuid PRIMARY KEY,questionnaire_id uuid REFERENCES public.questionnaires(id),unit_id uuid REFERENCES public.units_v2(id),quiz_completed boolean NOT NULL DEFAULT false,quiz_completed_at timestamptz,updated_at timestamptz DEFAULT now());
CREATE TABLE public.credit_events_v2(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),unit_id uuid NOT NULL REFERENCES public.units_v2(id),participant_id uuid REFERENCES public.participants_v2(id),type text NOT NULL,amount integer NOT NULL,description text,created_by uuid,created_at timestamptz DEFAULT now());
CREATE TABLE public.questionnaire_answers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),questionnaire_id uuid REFERENCES public.questionnaires(id),participant_id uuid REFERENCES public.participants_v2(id),question_id uuid REFERENCES public.questions(id),alternative_id uuid REFERENCES public.alternatives(id),UNIQUE(participant_id,question_id));
CREATE TABLE public.questionnaire_results(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id),participant_id uuid UNIQUE REFERENCES public.participants_v2(id),scores jsonb NOT NULL,percentages jsonb NOT NULL,main_profile_id uuid REFERENCES public.questionnaire_profiles(id),secondary_profile_id uuid REFERENCES public.questionnaire_profiles(id),result_code text,created_at timestamptz DEFAULT now());
DO $$ DECLARE t record; BEGIN FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.tablename);END LOOP;END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
COMMIT;

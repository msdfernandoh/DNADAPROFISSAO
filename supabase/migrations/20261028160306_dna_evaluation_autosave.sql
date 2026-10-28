-- Save only valid revision answers; never completes an evaluation or consumes credit.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
ALTER TABLE public.participants_v2 ADD COLUMN v1_draft_answers jsonb NOT NULL DEFAULT '[]'::jsonb
  CHECK(jsonb_typeof(v1_draft_answers)='array' AND jsonb_array_length(v1_draft_answers)<=15);
CREATE FUNCTION public.dna_save_evaluation_draft(p_participant uuid,p_revision text,p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $draft$
DECLARE p public.participants_v2%ROWTYPE; a jsonb;
BEGIN
 IF public.dna_current_session() IS NULL OR NOT dna_private.can_operate_participant(p_participant,'lead','update') THEN
   RAISE EXCEPTION 'Evaluation unavailable';
 END IF;
 SELECT * INTO p FROM public.participants_v2 WHERE id=p_participant FOR UPDATE;
 IF NOT FOUND OR p.quiz_completed OR p.v1_revision IS DISTINCT FROM p_revision OR p_revision IS NULL THEN
   RAISE EXCEPTION 'Evaluation unavailable';
 END IF;
 IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array' OR jsonb_array_length(p_answers)>15 THEN RAISE EXCEPTION 'Invalid answers';END IF;
 IF (SELECT count(DISTINCT value->>'questionId') FROM jsonb_array_elements(p_answers))<>jsonb_array_length(p_answers) THEN RAISE EXCEPTION 'Duplicate question';END IF;
 FOR a IN SELECT value FROM jsonb_array_elements(p_answers) LOOP
   IF jsonb_typeof(a) IS DISTINCT FROM 'object' OR (SELECT count(*) FROM jsonb_object_keys(a))<>2
   OR NOT EXISTS(SELECT 1 FROM dna_private.revision_options o JOIN dna_private.evaluation_revisions r ON r.revision=o.revision
       WHERE o.revision=p_revision AND r.questionnaire_id=p.questionnaire_id AND o.question_key=a->>'questionId' AND o.alternative_key=a->>'alternativeId')
   THEN RAISE EXCEPTION 'Invalid revision answer';END IF;
 END LOOP;
 UPDATE public.participants_v2 SET v1_draft_answers=p_answers,updated_at=now() WHERE id=p_participant;
 RETURN jsonb_build_object('saved',true,'answerCount',jsonb_array_length(p_answers));
END
$draft$;
REVOKE ALL ON FUNCTION public.dna_save_evaluation_draft(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_save_evaluation_draft(uuid,text,jsonb) TO authenticated;
COMMIT;

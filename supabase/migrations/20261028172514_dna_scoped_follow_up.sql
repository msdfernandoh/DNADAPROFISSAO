BEGIN;
SET LOCAL lock_timeout='3s';SET LOCAL statement_timeout='30s';
CREATE FUNCTION public.dna_get_follow_up(p_participant uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $follow$
DECLARE p public.participants_v2%ROWTYPE; history jsonb;
BEGIN
 IF NOT dna_private.can_operate_participant(p_participant,'lead','read') THEN RAISE EXCEPTION 'Participant unavailable';END IF;
 SELECT * INTO STRICT p FROM public.participants_v2 WHERE id=p_participant;
 SELECT coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) INTO history FROM(
  SELECT a.created_at,up.display_name AS author,a.metadata->>'previousStatus' AS previous_status,a.metadata->>'status' AS status,
   coalesce((a.metadata->>'notesChanged')::boolean,false) AS notes_changed
  FROM public.access_audit_events a LEFT JOIN public.user_profiles up ON up.id=a.actor_user_id
  WHERE a.institution_id=p.institution_id AND a.resource_id=p.id AND a.action='follow_up_updated'
  ORDER BY a.created_at DESC,a.id LIMIT 30)e;
 RETURN jsonb_build_object('id',p.id,'name',p.name,'status',p.status,'notes',p.notes,'updatedAt',p.updated_at,'history',history,
  'canUpdate',dna_private.can_operate_participant(p.id,'lead','update'));
END
$follow$;
CREATE FUNCTION public.dna_update_follow_up(p_participant uuid,p_changes jsonb,p_expected timestamptz) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $update$
DECLARE p public.participants_v2%ROWTYPE; new_status text; new_notes text;
BEGIN
 IF NOT dna_private.can_operate_participant(p_participant,'lead','update') THEN RAISE EXCEPTION 'Participant unavailable';END IF;
 IF jsonb_typeof(p_changes) IS DISTINCT FROM 'object' OR p_changes='{}'::jsonb
 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_changes) k WHERE k NOT IN ('status','notes')) THEN RAISE EXCEPTION 'Invalid changes';END IF;
 SELECT * INTO STRICT p FROM public.participants_v2 WHERE id=p_participant FOR UPDATE;
 IF p_expected IS NULL OR p.updated_at IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'Conflict: reload current record';END IF;
 new_status:=p.status;new_notes:=p.notes;
 IF p_changes?'status' THEN
  IF jsonb_typeof(p_changes->'status') IS DISTINCT FROM 'string' OR p_changes->>'status' NOT IN ('Aguardando teste','Novo','Em análise','Resultado enviado','Em atendimento','Matriculado') THEN RAISE EXCEPTION 'Invalid status';END IF;
  new_status:=p_changes->>'status';
 END IF;
 IF p_changes?'notes' THEN
  IF jsonb_typeof(p_changes->'notes') NOT IN ('string','null') OR length(p_changes->>'notes')>5000 THEN RAISE EXCEPTION 'Invalid notes';END IF;
  new_notes:=nullif(btrim(p_changes->>'notes'),'');
 END IF;
 IF new_status IS NOT DISTINCT FROM p.status AND new_notes IS NOT DISTINCT FROM p.notes THEN RETURN jsonb_build_object('saved',true,'unchanged',true);END IF;
 UPDATE public.participants_v2 SET status=new_status,notes=new_notes,updated_at=clock_timestamp() WHERE id=p.id;
 INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata)
 VALUES(p.institution_id,auth.uid(),'follow_up_updated','participant',p.id,'Authorized follow-up change',jsonb_build_object('previousStatus',p.status,'status',new_status,'notesChanged',new_notes IS DISTINCT FROM p.notes));
 RETURN jsonb_build_object('saved',true,'unchanged',false);
END
$update$;
REVOKE ALL ON FUNCTION public.dna_get_follow_up(uuid),public.dna_update_follow_up(uuid,jsonb,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_get_follow_up(uuid),public.dna_update_follow_up(uuid,jsonb,timestamptz) TO authenticated;
COMMIT;

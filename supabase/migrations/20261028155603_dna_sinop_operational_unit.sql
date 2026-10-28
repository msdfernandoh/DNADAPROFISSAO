-- Unidade piloto autorizada; depende da fundacao institucional aplicada.
-- Nao distribui participantes, nao concede creditos e nao altera pessoas.
BEGIN;
SET LOCAL lock_timeout='3s';SET LOCAL statement_timeout='30s';
DO $pilot$
DECLARE tenant uuid; existing_tenant uuid;
BEGIN
 SELECT id INTO STRICT tenant FROM public.institutions WHERE slug='unifecaf-sinop' AND active;
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='units_v2' AND column_name='institution_id') THEN RAISE EXCEPTION 'P3 002 required before unit preparation';END IF;
 SELECT institution_id INTO existing_tenant FROM public.units_v2 WHERE slug='unifecaf-sinop-piloto';
 IF FOUND THEN IF existing_tenant IS DISTINCT FROM tenant THEN RAISE EXCEPTION 'Conflicting unit scope';END IF;
 ELSE INSERT INTO public.units_v2(name,slug,institution_id,active) VALUES('UniFECAF Sinop — piloto','unifecaf-sinop-piloto',tenant,true);END IF;
END
$pilot$;
COMMIT;

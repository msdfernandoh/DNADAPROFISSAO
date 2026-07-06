-- Vendedores com link de indicação (slug) e WhatsApp
CREATE TABLE IF NOT EXISTS sales_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_vendors_slug_idx ON sales_vendors (slug);

COMMENT ON COLUMN sales_vendors.phone IS 'Apenas dígitos, preferencialmente com DDI 55';
COMMENT ON COLUMN sales_vendors.slug IS 'Identificador na URL: ?v=slug';

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS vendor_slug TEXT;

COMMENT ON COLUMN participants.vendor_slug IS 'Slug do vendedor que indicou o cadastro';

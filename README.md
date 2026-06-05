# DNA da Profissão

Site do teste de perfil profissional (Next.js), deploy na [Vercel](https://vercel.com) com domínio `dnadaprofissao.com.br`.

Repositório oficial: **https://github.com/msdfernandoh/DNADAPROFISSAO**

## Estrutura do projeto

| Caminho | Função |
|---------|--------|
| `app/page.tsx` | Fluxo principal: landing, cadastro, quiz, agradecimento |
| `app/resultado/` | Página de resultado / PDF |
| `app/admin/` | Painel de leads e participantes |
| `app/api/` | APIs (Supabase, login admin) |
| `components/dna/` | UI do produto |
| `lib/dna-data.ts` | Perfis e perguntas do teste |
| `public/` | Assets, `robots.txt`, `sitemap.xml` |
| `scripts/` | Migrações SQL (Supabase) |

## Desenvolvimento local

```bash
pnpm install
cp .env.example .env.local   # preencha as variáveis
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Copie `.env.example` para `.env.local` (nunca commite `.env.local`).

Na Vercel, configure as mesmas variáveis em **Project → Settings → Environment Variables**.

## Build

```bash
pnpm build
pnpm start
```

## Git e pastas no PC

Use **uma** pasta de trabalho ligada a este repositório:

- `DNA-DA-PROFISSAO/DNADAPROFISSAO` — clone limpo (recomendado)
- `DNA-DA-PROFISSAO/DNA` — pode ser a mesma cópia após alinhar o Git ao remote acima

Não use o remote antigo `DNAProject/DNA` (projeto Go legado); o site Next.js vive só neste repo.

## SEO

- Metadados: `app/layout.tsx`, `app/resultado/layout.tsx`, `app/admin/layout.tsx`
- `public/sitemap.xml` e `public/robots.txt`

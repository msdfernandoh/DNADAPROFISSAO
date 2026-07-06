/** Catálogo do editor — alinhado ao layout PDF V1 (conteúdo configurável). */

export type ReportEditorTabId =
  | "general"
  | "welcome"
  | "profile"
  | "pair"
  | "courses"
  | "theme"
  | "closing"

export type ReportEditorFieldDef = {
  section_key: string
  field_key: string
  label: string
  multiline?: boolean
  placeholder?: string
  hint?: string
}

export const REPORT_EDITOR_TABS: {
  id: ReportEditorTabId
  label: string
  description: string
  fields: ReportEditorFieldDef[]
  needsProfile?: boolean
  needsPair?: boolean
}[] = [
  {
    id: "general",
    label: "Capa / global",
    description: "Textos da capa e marca (layout V1).",
    fields: [
      { section_key: "cover", field_key: "diagnosis_label", label: "Label capa (ex.: DIAGNÓSTICO COMPLETO)" },
      { section_key: "cover", field_key: "bottom_tagline", label: "Tagline inferior da capa" },
      { section_key: "cover", field_key: "footer", label: "Rodapé / marca (página final)" },
      { section_key: "cover", field_key: "subtitle", label: "Subtítulo de marca" },
    ],
  },
  {
    id: "welcome",
    label: "Boas-vindas",
    description: "Página 02 — um parágrafo por linha ou JSON nos cards.",
    fields: [
      { section_key: "global", field_key: "welcome_section_label", label: "Label seção (ex.: 01 · BEM-VINDO(A))" },
      { section_key: "global", field_key: "welcome_title", label: "Título principal" },
      {
        section_key: "global",
        field_key: "welcome_paragraphs",
        label: "Parágrafos",
        multiline: true,
        hint: "Um parágrafo por linha",
      },
      {
        section_key: "global",
        field_key: "welcome_cards_json",
        label: "Cards 01/02/03 (JSON)",
        multiline: true,
        placeholder: '[{"n":"01","t":"QUEM VOCÊ É","d":"..."}]',
      },
    ],
  },
  {
    id: "profile",
    label: "Perfil principal",
    description: "Páginas 03–06 e blocos finais do V1.",
    needsProfile: true,
    fields: [
      { section_key: "profile_main", field_key: "display_name", label: "Nome do perfil (override)" },
      { section_key: "profile_main", field_key: "subtitle", label: "Subtítulo do perfil" },
      { section_key: "profile_main", field_key: "tagline", label: "Tagline / em uma frase" },
      {
        section_key: "profile_main",
        field_key: "super_powers",
        label: "Superpoderes (chips)",
        multiline: true,
        hint: "Uma linha por chip",
      },
      { section_key: "profile_main", field_key: "who_you_are", label: "Quem é você", multiline: true },
      { section_key: "profile_main", field_key: "daily_analogy", label: "Analogia do dia a dia", multiline: true },
      { section_key: "profile_main", field_key: "how_you_function", label: "Como você funciona", multiline: true },
      { section_key: "profile_main", field_key: "how_you_act", label: "Como você age", multiline: true },
      { section_key: "profile_main", field_key: "how_you_decide", label: "Como decide", multiline: true },
      { section_key: "profile_main", field_key: "what_motivates", label: "O que motiva", multiline: true },
      { section_key: "profile_main", field_key: "what_drains", label: "O que cansa", multiline: true },
      { section_key: "profile_main", field_key: "ideal_environment", label: "Ambiente ideal", multiline: true },
      { section_key: "profile_main", field_key: "strengths", label: "Pontos fortes", multiline: true },
      { section_key: "profile_main", field_key: "attention_points", label: "Pontos de atenção", multiline: true },
      { section_key: "profile_main", field_key: "reflection", label: "Reflexão importante", multiline: true },
      {
        section_key: "profile_main",
        field_key: "compatibility_areas_json",
        label: "Áreas de compatibilidade (JSON)",
        multiline: true,
        placeholder: '[{"name":"Liderança","pct":97}]',
      },
      { section_key: "profile_main", field_key: "visualization", label: "Visualização 3–5 anos", multiline: true },
      { section_key: "profile_main", field_key: "final_message", label: "Mensagem final (citação)", multiline: true },
      {
        section_key: "profile_main",
        field_key: "salaries_json",
        label: "Faixas salariais (JSON)",
        multiline: true,
      },
      { section_key: "profile_main", field_key: "top_salary", label: "Salário destaque (número)" },
    ],
  },
  {
    id: "pair",
    label: "Combinação",
    description: "Segunda força + sinergia.",
    needsPair: true,
    fields: [
      { section_key: "profile_pair", field_key: "synergy", label: "Sinergia (extra V2)", multiline: true },
      { section_key: "profile_secondary", field_key: "tagline", label: "Tagline segunda força" },
      { section_key: "profile_secondary", field_key: "who_you_are", label: "Descrição segunda força", multiline: true },
      { section_key: "profile_secondary", field_key: "subtitle", label: "Subtítulo segunda força" },
    ],
  },
  {
    id: "courses",
    label: "Cursos",
    description: "Páginas 08–10.",
    fields: [
      { section_key: "courses", field_key: "intro_title", label: "Título intro cursos" },
      { section_key: "courses", field_key: "intro_subtitle", label: "Subtítulo intro cursos" },
      {
        section_key: "courses",
        field_key: "recommended_json",
        label: "Cursos recomendados (JSON)",
        multiline: true,
      },
    ],
  },
  {
    id: "theme",
    label: "Tema visual",
    description: "Cores e emoji da capa (por perfil).",
    needsProfile: true,
    fields: [
      { section_key: "profile_main", field_key: "cover_emoji", label: "Emoji capa" },
      { section_key: "profile_main", field_key: "cover_number", label: "Selo capa" },
      { section_key: "profile_main", field_key: "theme_primary", label: "Cor primária (#hex)" },
      { section_key: "profile_main", field_key: "theme_primary_light", label: "Cor primária clara" },
      { section_key: "profile_main", field_key: "theme_primary_dark", label: "Cor primária escura" },
      { section_key: "profile_main", field_key: "theme_accent", label: "Cor de apoio" },
    ],
  },
  {
    id: "closing",
    label: "Encerramento",
    description: "CTA e textos comerciais.",
    fields: [
      { section_key: "global", field_key: "compatibility_intro", label: "Intro áreas compatibilidade", multiline: true },
      { section_key: "global", field_key: "salaries_footnote", label: "Rodapé página salários" },
      { section_key: "global", field_key: "closing_commercial", label: "Parágrafo comercial final", multiline: true },
      { section_key: "global", field_key: "closing_message", label: "Mensagem final" },
      { section_key: "global", field_key: "cta", label: "CTA" },
    ],
  },
]

export const DEFAULT_REPORT_SECTIONS: { section_key: string; title: string; sort_order: number }[] = [
  { section_key: "cover", title: "Capa", sort_order: 0 },
  { section_key: "global", title: "Global", sort_order: 1 },
  { section_key: "profile_main", title: "Perfil principal", sort_order: 2 },
  { section_key: "profile_secondary", title: "Segunda força", sort_order: 3 },
  { section_key: "profile_pair", title: "Combinação", sort_order: 4 },
  { section_key: "courses", title: "Cursos", sort_order: 5 },
]

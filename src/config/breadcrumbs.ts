/**
 * Configuração de breadcrumbs (nota de UX da auditoria #16).
 * Mapa rota normalizada -> trilho; segmentos dinâmicos (ids cuid) viram [id].
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const MODULE_HOME: Record<string, { label: string; href: string }> = {
  gestao: { label: "Gestão", href: "/gestao/dashboard" },
  finance: { label: "Finanças", href: "/finance/faturacao" },
  crm: { label: "CRM", href: "/crm/funil-vendas" },
  ia: { label: "IA", href: "/ia/assistente" },
  rh: { label: "RH", href: "/rh/funcionarios" },
  marketing: { label: "Marketing", href: "/marketing/campanhas" },
  educacao: { label: "Educação", href: "/educacao/alunos" },
  store: { label: "Loja", href: "/store/catalogo" },
  admin: { label: "Administração", href: "/admin" },
};

// Trilho da página (sem a raiz "Início" nem o módulo, adicionados depois).
const PAGES: Record<string, BreadcrumbItem[]> = {
  // Gestão
  "gestao/dashboard": [{ label: "Dashboard" }],
  "gestao/perfil": [{ label: "Perfil" }],
  "gestao/configuracao": [{ label: "Configurações" }],
  "gestao/cargos": [{ label: "Cargos" }],
  "gestao/organizacoes": [{ label: "Organizações" }],
  "gestao/clientes": [{ label: "Clientes" }],
  "gestao/clientes/novo": [{ label: "Clientes", href: "/gestao/clientes" }, { label: "Novo Cliente" }],
  "gestao/produtos": [{ label: "Produtos" }],
  "gestao/produtos/novo": [{ label: "Produtos", href: "/gestao/produtos" }, { label: "Novo Produto" }],
  "gestao/servicos": [{ label: "Serviços" }],
  "gestao/servicos/novo": [{ label: "Serviços", href: "/gestao/servicos" }, { label: "Novo Serviço" }],
  "gestao/stock": [{ label: "Stock" }],
  "gestao/stock/movimento": [{ label: "Stock", href: "/gestao/stock" }, { label: "Movimento" }],
  "gestao/compras": [{ label: "Compras" }],
  "gestao/compras/nova": [{ label: "Compras", href: "/gestao/compras" }, { label: "Nova Compra" }],
  "gestao/despesas": [{ label: "Despesas" }],
  "gestao/despesas/nova": [{ label: "Despesas", href: "/gestao/despesas" }, { label: "Nova Despesa" }],
  "gestao/vendas": [{ label: "Vendas" }],
  "gestao/vendas/nova": [{ label: "Vendas", href: "/gestao/vendas" }, { label: "Nova Venda" }],
  "gestao/fluxo-caixa": [{ label: "Fluxo de Caixa" }],
  "gestao/relatorio": [{ label: "Relatório" }],

  // Finanças
  "finance/faturacao": [{ label: "Faturação" }],
  "finance/faturacao/nova": [{ label: "Faturação", href: "/finance/faturacao" }, { label: "Nova Fatura" }],
  "finance/faturacao/[id]": [{ label: "Faturação", href: "/finance/faturacao" }, { label: "Detalhes" }],
  "finance/faturacao/[id]/editar": [{ label: "Faturação", href: "/finance/faturacao" }, { label: "Editar" }],
  "finance/orcamentos": [{ label: "Orçamentos" }],
  "finance/orcamentos/novo": [{ label: "Orçamentos", href: "/finance/orcamentos" }, { label: "Novo Orçamento" }],
  "finance/orcamentos/[id]": [{ label: "Orçamentos", href: "/finance/orcamentos" }, { label: "Detalhes" }],
  "finance/orcamentos/[id]/editar": [{ label: "Orçamentos", href: "/finance/orcamentos" }, { label: "Editar" }],
  "finance/cobrancas": [{ label: "Cobranças" }],
  "finance/contas-pagar": [{ label: "Contas a Pagar" }],
  "finance/contas-receber": [{ label: "Contas a Receber" }],
  "finance/relatorios": [{ label: "Relatórios" }],

  // CRM
  "crm/funil-vendas": [{ label: "Funil de Vendas" }],
  "crm/clientes": [{ label: "Clientes" }],
  "crm/propostas": [{ label: "Propostas" }],
  "crm/agenda": [{ label: "Agenda" }],
  "crm/follow-up": [{ label: "Follow-up" }],

  // IA
  "ia/assistente": [{ label: "Assistente" }],
  "ia/recomendacoes": [{ label: "Recomendações" }],
  "ia/analise-vendas": [{ label: "Análise de Vendas" }],
  "ia/previsoes": [{ label: "Previsões" }],
  "ia/relatorios": [{ label: "Relatórios IA" }],

  // RH
  "rh/funcionarios": [{ label: "Funcionários" }],
  "rh/permissoes": [{ label: "Permissões" }],
  "rh/ferias": [{ label: "Férias" }],
  "rh/presencas": [{ label: "Presenças" }],
  "rh/salarios": [{ label: "Salários" }],

  // Marketing
  "marketing/campanhas": [{ label: "Campanhas" }],
  "marketing/email-marketing": [{ label: "Email Marketing" }],
  "marketing/fidelizacao": [{ label: "Fidelização" }],
  "marketing/promocoes": [{ label: "Promoções" }],

  // Educação
  "educacao/alunos": [{ label: "Alunos" }],
  "educacao/alunos/novo": [{ label: "Alunos", href: "/educacao/alunos" }, { label: "Novo Aluno" }],

  // Loja
  "store/catalogo": [{ label: "Catálogo" }],
  "store/encomendas": [{ label: "Encomendas" }],
  "store/loja": [{ label: "Loja" }],
  "store/pagamentos": [{ label: "Pagamentos" }],

  // Administração
  admin: [{ label: "Dashboard" }],
  "admin/usuarios": [{ label: "Utilizadores" }],
  "admin/empresas": [{ label: "Empresas" }],
  "admin/recursos": [{ label: "Recursos" }],
  "admin/permissoes": [{ label: "Permissões" }],
  "admin/servicos": [{ label: "Serviços" }],
  "admin/conteudos": [{ label: "Conteúdos" }],
  "admin/conteudos/novo": [{ label: "Conteúdos", href: "/admin/conteudos" }, { label: "Novo Conteúdo" }],
  "admin/anuncios": [{ label: "Anúncios" }],
  "admin/logs": [{ label: "Logs" }],
};

// Segmentos literais conhecidos da árvore de rotas; tudo o resto (ids cuid de
// rotas dinâmicas como /finance/faturacao/[id]) normaliza para [id].
const LITERAL_SEGMENTS = new Set([
  // raízes de módulo (primeiro segmento de MODULE_HOME)
  "admin", "gestao", "finance", "crm", "ia", "rh", "marketing", "educacao", "store",
  // páginas
  "dashboard", "perfil", "configuracao", "cargos", "organizacoes", "clientes",
  "produtos", "servicos", "stock", "movimento", "compras", "despesas", "vendas",
  "fluxo-caixa", "relatorio", "faturacao", "orcamentos", "cobrancas",
  "contas-pagar", "contas-receber", "relatorios", "funil-vendas", "propostas",
  "agenda", "follow-up", "assistente", "recomendacoes", "analise-vendas",
  "previsoes", "funcionarios", "permissoes", "ferias", "presencas", "salarios",
  "campanhas", "email-marketing", "fidelizacao", "promocoes", "alunos",
  "catalogo", "encomendas", "loja", "pagamentos", "usuarios", "empresas",
  "recursos", "anuncios", "logs", "conteudos", "novo", "nova", "editar",
]);

function normalizeKey(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  return segments
    .map((seg) => (LITERAL_SEGMENTS.has(seg) ? seg : "[id]"))
    .join("/");
}

function humanize(segment: string): string {
  const label = segment.replace(/[-_]/g, " ").replace(/\[id\]/g, "Detalhes");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const mod = MODULE_HOME[segments[0]];
  if (!mod) return null;

  const home: BreadcrumbItem = {
    label: "Início",
    href: segments[0] === "admin" ? "/admin" : "/gestao/dashboard",
  };

  const key = normalizeKey(pathname);
  const pageTrail = key ? PAGES[key] : undefined;

  const trail: BreadcrumbItem[] = [home, { label: mod.label, href: mod.href }];

  if (pageTrail) {
    trail.push(...pageTrail);
    return trail;
  }

  // Fallback para rotas novas: módulo + segmentos restantes humanizados.
  const rest = segments.slice(1).map((seg) => humanize(seg));
  trail.push(...rest.map((label, i) => ({ label })));
  return trail;
}
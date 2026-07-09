export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/gestao/dashboard": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"],
  "/gestao/clientes": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "COOPERATIVA"],
  "/gestao/produtos": ["EMPRESA", "COOPERATIVA"],
  "/gestao/servicos": ["EMPREENDEDOR", "EMPRESA"],
  "/gestao/vendas": ["EMPREENDEDOR", "EMPRESA", "ONG"],
  "/gestao/compras": ["EMPRESA"],
  "/gestao/despesas": ["EMPRESA"],
  "/gestao/fluxo-caixa": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"],
  "/gestao/stock": ["EMPRESA", "COOPERATIVA"],
  "/gestao/perfil": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"],
  "/crm": ["EMPRESA"],
  "/ia": ["EMPRESA"],
  "/rh": ["EMPRESA"],
  "/marketing": ["EMPRESA", "ONG"],
  "/educacao": ["EDUCACAO"],
  "/admin": ["admin"],
  "/admin/recursos": ["admin"],
  "/admin/permissoes": ["admin"],
  "/admin/conteudos": ["admin"],
};

export const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/onboarding", "/praca", "/sobre", "/biblioteca", "/unauthorized"];

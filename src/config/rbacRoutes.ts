export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/gestao/dashboard": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"],
  "/gestao/clientes": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "COOPERATIVA"],
  "/gestao/produtos": ["EMPRESA"],
  "/gestao/servicos": ["EMPREENDEDOR", "EMPRESA"],
  "/gestao/vendas": ["EMPREENDEDOR", "EMPRESA"],
  "/gestao/compras": ["EMPRESA"],
  "/gestao/despesas": ["EMPRESA"],
  "/gestao/fluxo-caixa": ["EMPRESA"],
  "/gestao/stock": ["EMPRESA"],
  "/gestao/equipa": ["EMPRESA"],
  "/gestao/perfil": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"],
  "/finance": ["EMPRESA", "COOPERATIVA", "EMPREENDEDOR"],
  "/rh": ["EMPRESA"],
  "/marketing": ["EMPRESA"],
  "/crm": ["EMPRESA"],
  "/ia": ["EMPRESA"],
  "/store": ["EMPRESA"],
  "/admin": ["admin"],
  "/admin/recursos": ["admin"],
  "/admin/permissoes": ["admin"],
};

export const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/praca", "/unauthorized"];

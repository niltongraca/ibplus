export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/gestao/dashboard": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"],
  "/gestao/clientes": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "COOPERATIVA"],
  "/gestao/produtos": ["EMPRESA"],
  "/gestao/servicos": ["EMPREENDEDOR", "EMPRESA"],
  "/gestao/vendas": ["EMPREENDEDOR", "EMPRESA"],
  "/gestao/equipa": ["EMPRESA"],
  "/gestao/perfil": ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"],
  "/finance": ["EMPRESA", "COOPERATIVA", "EMPREENDEDOR"],
  "/rh": ["EMPRESA"],
  "/marketing": ["EMPRESA"],
  "/admin": ["admin"],
};

export const PLAN_ROUTES: Record<string, string[]> = {
  "/finance": ["PREMIUM", "BUSINESS"],
  "/rh": ["BUSINESS"],
  "/marketing": ["PREMIUM", "BUSINESS"],
};

export const PUBLIC_ROUTES = ["/", "/login", "/cadastro", "/recuperar-senha"];

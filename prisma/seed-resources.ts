import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";

neonConfig.webSocketConstructor = WebSocket as any;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const resources = [
    { key: "dashboard", label: "Dashboard", description: "Painel principal com indicadores", icon: "LayoutDashboard", enabled: true },
    { key: "produtos", label: "Produtos", description: "Gestão de produtos e stock", icon: "Package", enabled: true },
    { key: "servicos", label: "Serviços", description: "Gestão de serviços prestados", icon: "Wrench", enabled: true },
    { key: "clientes", label: "Clientes", description: "Base de dados de clientes", icon: "Users", enabled: true },
    { key: "vendas", label: "Vendas", description: "Registo de vendas", icon: "ShoppingCart", enabled: true },
    { key: "compras", label: "Compras", description: "Gestão de compras e fornecedores", icon: "Truck", enabled: true },
    { key: "despesas", label: "Despesas", description: "Controlo de despesas", icon: "Receipt", enabled: true },
    { key: "fluxo-caixa", label: "Fluxo de Caixa", description: "Movimentação financeira", icon: "ArrowLeftRight", enabled: true },
    { key: "stock", label: "Stock", description: "Controlo de inventário", icon: "Warehouse", enabled: true },
    { key: "faturacao", label: "Facturação", description: "Emissão de facturas", icon: "FileText", enabled: true },
    { key: "orcamentos", label: "Orçamentos", description: "Criação de orçamentos", icon: "Calculator", enabled: true },
    { key: "cobrancas", label: "Cobranças", description: "Gestão de cobranças", icon: "HandCoins", enabled: true },
    { key: "contas-pagar", label: "Contas a Pagar", description: "Contas pendentes", icon: "ArrowDownCircle", enabled: true },
    { key: "contas-receber", label: "Contas a Receber", description: "Valores a receber", icon: "ArrowUpCircle", enabled: true },
    { key: "relatorios", label: "Relatórios", description: "Relatórios financeiros", icon: "BarChart3", enabled: true },
    { key: "rh", label: "Recursos Humanos", description: "Gestão de funcionários", icon: "Building2", enabled: true },
    { key: "marketing", label: "Marketing", description: "Campanhas e promoções", icon: "Megaphone", enabled: true },
    { key: "crm", label: "CRM", description: "Gestão de relacionamento", icon: "HeartHandshake", enabled: true },
    { key: "ia", label: "Inteligência Artificial", description: "Análises e previsões", icon: "Brain", enabled: true },
    { key: "store", label: "Loja Online", description: "E-commerce integrado", icon: "Store", enabled: true },
    { key: "praca", label: "Praça", description: "Marketplace da IBPlus+", icon: "Globe", enabled: true },
  ];

  const allTypes = ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"];

  const defaultPermissions: Record<string, string[]> = {
    dashboard: allTypes,
    produtos: ["EMPRESA"],
    servicos: ["EMPREENDEDOR", "EMPRESA"],
    clientes: ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "COOPERATIVA"],
    vendas: ["EMPREENDEDOR", "EMPRESA"],
    compras: ["EMPRESA"],
    despesas: ["EMPRESA"],
    "fluxo-caixa": ["EMPRESA"],
    stock: ["EMPRESA"],
    faturacao: ["EMPREENDEDOR", "EMPRESA", "COOPERATIVA"],
    orcamentos: ["EMPREENDEDOR", "EMPRESA"],
    cobrancas: ["EMPRESA", "COOPERATIVA"],
    "contas-pagar": ["EMPRESA"],
    "contas-receber": ["EMPRESA"],
    relatorios: ["EMPRESA", "COOPERATIVA", "EMPREENDEDOR"],
    rh: ["EMPRESA"],
    marketing: ["EMPRESA"],
    crm: ["EMPRESA", "COOPERATIVA"],
    ia: ["EMPRESA"],
    store: ["EMPRESA"],
    praca: ["EMPRESA"],
  };

  for (const res of resources) {
    const existing = await prisma.resource.findUnique({ where: { key: res.key } });
    if (!existing) {
      const resource = await prisma.resource.create({ data: res });
      const allowedTypes = defaultPermissions[res.key] || [];
      for (const type of allTypes) {
        await prisma.resourcePermission.create({
          data: { resourceId: resource.id, accountType: type as any, allowed: allowedTypes.includes(type) },
        });
      }
      console.log(`  ✓ ${res.label} criado`);
    } else {
      console.log(`  - ${res.label} já existe`);
    }
  }

  console.log("Resources seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

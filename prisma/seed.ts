import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = WebSocket as any;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const password = await bcrypt.hash("123456", 10);

  const company = await prisma.company.create({
    data: {
      name: "IBPlus Demo",
      nif: "5000000000",
      email: "demo@ibplus.co.ao",
      phone: "+244 900 000 000",
      address: "Luanda, Angola",
    },
  });

  await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@ibplus.co.ao",
      password,
      accountType: "EMPRESA",
      plan: "BUSINESS",
      role: "admin",
      companyId: company.id,
      profile: {
        create: { nome: "Administrador", nif: "5000000000", telefone: "+244 900 000 000" },
      },
    },
  }).catch(() => {
    console.log("Admin já existe, a continuar...");
  });

  const adminPassword = await bcrypt.hash("@Gracepu47", 10);
  await prisma.user.create({
    data: {
      name: "Admin IBPlus+",
      email: "admin@ibplus.com",
      password: adminPassword,
      accountType: "EMPRESA",
      plan: "BUSINESS",
      role: "admin",
      companyId: company.id,
      profile: {
        create: { nome: "Admin IBPlus+", telefone: "+244 900 000 001" },
      },
    },
  }).catch(() => {
    console.log("Admin IBPlus+ já existe, a continuar...");
  });

  const existingCats = await prisma.category.count();
  if (existingCats > 0) {
    console.log("Dados já existem, a saltar criação de produtos/clientes/vendas...");
    return;
  }

  const cat1 = await prisma.category.create({ data: { name: "Alimentação" } });
  const cat2 = await prisma.category.create({ data: { name: "Bebidas" } });
  const cat3 = await prisma.category.create({ data: { name: "Higiene" } });
  const cat4 = await prisma.category.create({ data: { name: "Material de Escritório" } });

  await prisma.product.createMany({
    data: [
      { companyId: company.id, categoryId: cat1.id, name: "Arroz Fardão 25kg", price: 18500, cost: 15000, stock: 120, minStock: 20, unit: "un" },
      { companyId: company.id, categoryId: cat1.id, name: "Óleo Fula 5L", price: 4500, cost: 3600, stock: 80, minStock: 15, unit: "un" },
      { companyId: company.id, categoryId: cat1.id, name: "Farinha de Trigo 1kg", price: 850, cost: 600, stock: 200, minStock: 50, unit: "un" },
      { companyId: company.id, categoryId: cat1.id, name: "Açúcar 1kg", price: 750, cost: 550, stock: 150, minStock: 30, unit: "un" },
      { companyId: company.id, categoryId: cat1.id, name: "Leite Ninho 400g", price: 1200, cost: 900, stock: 90, minStock: 20, unit: "un" },
      { companyId: company.id, categoryId: cat2.id, name: "Cuca 33cl", price: 350, cost: 250, stock: 500, minStock: 100, unit: "un" },
      { companyId: company.id, categoryId: cat2.id, name: "Nocal 33cl", price: 300, cost: 200, stock: 400, minStock: 80, unit: "un" },
      { companyId: company.id, categoryId: cat2.id, name: "Água Kiss 1.5L", price: 250, cost: 150, stock: 300, minStock: 60, unit: "un" },
      { companyId: company.id, categoryId: cat3.id, name: "Sabão em Pó Omo 500g", price: 650, cost: 480, stock: 60, minStock: 15, unit: "un" },
      { companyId: company.id, categoryId: cat3.id, name: "Pasta Dental Colgate", price: 550, cost: 400, stock: 70, minStock: 20, unit: "un" },
      { companyId: company.id, categoryId: cat4.id, name: "Resma Papel A4 500fls", price: 3500, cost: 2800, stock: 30, minStock: 10, unit: "un" },
      { companyId: company.id, categoryId: cat4.id, name: "Caneta Esferográfica 10un", price: 450, cost: 300, stock: 100, minStock: 25, unit: "cx" },
    ],
  });

  const products = await prisma.product.findMany({ where: { companyId: company.id } });

  await prisma.customer.createMany({
    data: [
      { companyId: company.id, name: "Maria dos Santos", email: "maria@email.com", phone: "+244 923 456 789", type: "particular" },
      { companyId: company.id, name: "João Pedro", email: "joao@email.com", phone: "+244 933 456 789", type: "particular" },
      { companyId: company.id, name: "Ana Paula", email: "ana@email.com", phone: "+244 943 456 789", type: "particular" },
      { companyId: company.id, name: "Comercial Lda", email: "comercial@email.com", phone: "+244 212 456 789", nif: "5000000001", type: "empresa" },
      { companyId: company.id, name: "Mega Store SA", email: "mega@email.com", phone: "+244 212 456 790", nif: "5000000002", type: "empresa" },
    ],
  });

  const customers = await prisma.customer.findMany({ where: { companyId: company.id } });

  const sale1 = await prisma.sale.create({
    data: {
      companyId: company.id,
      customerId: customers[0].id,
      total: 27500,
      status: "completed",
      paymentMethod: "dinheiro",
      date: new Date("2026-06-28"),
    },
  });
  await prisma.saleItem.createMany({
    data: [
      { saleId: sale1.id, productId: products[0].id, quantity: 1, unitPrice: 18500, total: 18500 },
      { saleId: sale1.id, productId: products[1].id, quantity: 2, unitPrice: 4500, total: 9000 },
    ],
  });

  const sale2 = await prisma.sale.create({
    data: {
      companyId: company.id,
      customerId: customers[1].id,
      total: 5250,
      status: "completed",
      paymentMethod: "multicaixa",
      date: new Date("2026-06-29"),
    },
  });
  await prisma.saleItem.createMany({
    data: [
      { saleId: sale2.id, productId: products[5].id, quantity: 12, unitPrice: 350, total: 4200 },
      { saleId: sale2.id, productId: products[7].id, quantity: 3, unitPrice: 250, total: 750 },
      { saleId: sale2.id, productId: products[8].id, quantity: 1, unitPrice: 300, total: 300 },
    ],
  });

  const sale3 = await prisma.sale.create({
    data: {
      companyId: company.id,
      customerId: customers[3].id,
      total: 37000,
      status: "pending",
      paymentMethod: "transferencia",
      date: new Date("2026-06-30"),
    },
  });
  await prisma.saleItem.createMany({
    data: [
      { saleId: sale3.id, productId: products[0].id, quantity: 2, unitPrice: 18500, total: 37000 },
    ],
  });

  const purchase1 = await prisma.purchase.create({
    data: {
      companyId: company.id,
      supplier: "Distribuidora Angolar Lda",
      total: 180000,
      status: "completed",
      date: new Date("2026-06-25"),
    },
  });
  await prisma.purchaseItem.createMany({
    data: [
      { purchaseId: purchase1.id, productId: products[0].id, quantity: 10, unitPrice: 15000, total: 150000 },
      { purchaseId: purchase1.id, productId: products[1].id, quantity: 5, unitPrice: 6000, total: 30000 },
    ],
  });

  await prisma.expense.createMany({
    data: [
      { companyId: company.id, description: "Renda do mês", amount: 120000, category: "aluguel", date: new Date("2026-06-01"), paid: true },
      { companyId: company.id, description: "Electricidade", amount: 25000, category: "utilidades", date: new Date("2026-06-10"), paid: true },
      { companyId: company.id, description: "Água", amount: 8500, category: "utilidades", date: new Date("2026-06-10"), paid: true },
      { companyId: company.id, description: "Salários", amount: 350000, category: "folha", date: new Date("2026-06-28"), paid: true },
      { companyId: company.id, description: "Marketing Digital", amount: 45000, category: "marketing", date: new Date("2026-06-15"), paid: false },
    ],
  });

  await prisma.employee.createMany({
    data: [
      { companyId: company.id, name: "Carlos Alberto", email: "carlos@ibplus.co.ao", position: "Vendedor", salary: 120000, hireDate: new Date("2025-01-15"), active: true },
      { companyId: company.id, name: "Luciana Fernandes", email: "luciana@ibplus.co.ao", position: "Financeira", salary: 150000, hireDate: new Date("2025-02-01"), active: true },
      { companyId: company.id, name: "Pedro Miguel", email: "pedro@ibplus.co.ao", position: "Gestor", salary: 200000, hireDate: new Date("2024-11-01"), active: true },
    ],
  });

  const inv1 = await prisma.invoice.create({
    data: {
      companyId: company.id,
      number: "FAT-2026-0001",
      customer: "Mega Store SA",
      total: 37000,
      status: "pending",
      date: new Date("2026-06-30"),
      dueDate: new Date("2026-07-30"),
    },
  });
  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv1.id, description: "Arroz Fardão 25kg x 2", quantity: 2, unitPrice: 18500, total: 37000 },
    ],
  });

  console.log("Seed completed successfully!");
}

async function seedResources() {
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
    { key: "students", label: "Alunos", description: "Gestão de alunos", icon: "GraduationCap", enabled: true },
    { key: "conteudos", label: "Conteúdos", description: "Vídeos, artigos, ebooks e posts", icon: "BookOpen", enabled: true },
  ];

  const allTypes = ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "EDUCACAO", "COOPERATIVA"];

  // Default permissions per resource (alinhado com os novos menus por accountType)
  const defaultPermissions: Record<string, string[]> = {
    dashboard: allTypes,
    produtos: ["EMPRESA", "COOPERATIVA"],
    servicos: ["EMPREENDEDOR", "EMPRESA"],
    clientes: ["EMPREENDEDOR", "EMPRESA", "ONG", "ASSOCIACAO", "COOPERATIVA"],
    vendas: ["EMPREENDEDOR", "EMPRESA", "ONG"],
    compras: ["EMPRESA"],
    despesas: ["EMPRESA"],
    "fluxo-caixa": allTypes,
    stock: ["EMPRESA", "COOPERATIVA"],
    faturacao: ["EMPRESA"],
    orcamentos: ["EMPRESA"],
    cobrancas: ["EMPRESA"],
    "contas-pagar": ["EMPRESA"],
    "contas-receber": ["EMPRESA"],
    relatorios: ["EMPRESA"],
    rh: ["EMPRESA"],
    marketing: ["EMPRESA", "ONG"],
    crm: ["EMPRESA"],
    ia: ["EMPRESA"],
    store: ["EMPRESA"],
    praca: ["EMPRESA"],
    students: ["EDUCACAO"],
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
    }
  }
}

main()
  .then(() => seedResources())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

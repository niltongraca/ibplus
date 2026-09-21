import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getBreadcrumbs } from "./breadcrumbs";

describe("getBreadcrumbs", () => {
  it("monta Início / Módulo / Página em rotas comuns", () => {
    const trail = getBreadcrumbs("/finance/faturacao");
    assert.deepEqual(trail, [
      { label: "Início", href: "/gestao/dashboard" },
      { label: "Finanças", href: "/finance/faturacao" },
      { label: "Faturação" },
    ]);
  });

  it("normaliza ids dinâmicos (cuid) para [id]", () => {
    const trail = getBreadcrumbs("/finance/faturacao/clg8xj1x3000008mh9p5k5q0x/editar");
    assert.deepEqual(trail, [
      { label: "Início", href: "/gestao/dashboard" },
      { label: "Finanças", href: "/finance/faturacao" },
      { label: "Faturação", href: "/finance/faturacao" },
      { label: "Editar" },
    ]);
  });

  it("inclui sub-página de registo (Nova Venda) com link ao módulo", () => {
    const trail = getBreadcrumbs("/gestao/vendas/nova");
    assert.deepEqual(trail, [
      { label: "Início", href: "/gestao/dashboard" },
      { label: "Gestão", href: "/gestao/dashboard" },
      { label: "Vendas", href: "/gestao/vendas" },
      { label: "Nova Venda" },
    ]);
  });

  it("na área admin, Início aponta para /admin", () => {
    const trail = getBreadcrumbs("/admin");
    assert.deepEqual(trail, [
      { label: "Início", href: "/admin" },
      { label: "Administração", href: "/admin" },
      { label: "Dashboard" },
    ]);
  });

  it("devolve null em páginas públicas sem módulo", () => {
    assert.equal(getBreadcrumbs("/praca"), null);
    assert.equal(getBreadcrumbs("/"), null);
    assert.equal(getBreadcrumbs("/login"), null);
  });

  it("faz fallback humanizado para rotas futuras", () => {
    const trail = getBreadcrumbs("/rh/novo-modulo");
    assert.ok(trail);
    assert.equal(trail[trail.length - 1].label, "Novo modulo");
  });
});
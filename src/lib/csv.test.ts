import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { jsonToCsv } from "./csv";

describe("jsonToCsv", () => {
  const headers = { name: "Nome", total: "Total" };

  it("escapa vírgulas, aspas e quebras de linha", () => {
    const csv = jsonToCsv([{ name: 'Silva, "Ana"\nLinha 2', total: 10 }], headers);
    assert.equal(csv, 'Nome,Total\r\n"Silva, ""Ana""\nLinha 2",10');
  });

  it("neutraliza injeção de fórmula", () => {
    const csv = jsonToCsv(
      [
        { name: "=HYPERLINK(\"http://x\")", total: 1 },
        { name: "@SUM(A1:A9)", total: 2 },
        { name: "-1+1", total: 3 },
        { name: "  +CMD", total: 4 },
      ],
      headers
    );
    assert.match(csv, /"'=HYPERLINK/);
    assert.match(csv, /'@SUM/);
    assert.match(csv, /'-1\+1/);
    assert.match(csv, /'  \+CMD/);
  });
});

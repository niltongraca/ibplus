import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { remainingTickets } from "./eventRegistrations";

describe("remainingTickets", () => {
  it("devolve null para stock ilimitado", () => {
    assert.equal(remainingTickets(0, 999), null);
    assert.equal(remainingTickets(-1, 0), null);
  });

  it("desconta reservas e nunca passa de zero", () => {
    assert.equal(remainingTickets(10, 3), 7);
    assert.equal(remainingTickets(3, 3), 0);
    assert.equal(remainingTickets(2, 5), 0);
  });
});

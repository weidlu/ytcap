import { describe, expect, it } from "vitest";

describe("project smoke", () => {
  it("loads the config module", async () => {
    const mod = await import("../../src/config.js");
    expect(typeof mod.readConfig).toBe("function");
  });
});

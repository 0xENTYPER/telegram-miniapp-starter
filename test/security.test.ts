import { describe, expect, it } from "vitest";
import { handleCommand, parseCommand } from "../bot/commands";
import { signInitData, validateInitData } from "../server/validate-init-data";

describe("Mini App initData", () => {
  it("validates signed and fresh data", async () => {
    const signed = await signInitData({ auth_date: "1000", query_id: "q1", user: '{"id":42,"first_name":"Ada"}' }, "123:demo");
    const result = await validateInitData(signed, "123:demo", 1100);
    expect(result.queryId).toBe("q1");
    expect(result.user).toEqual({ id: 42, first_name: "Ada" });
  });

  it("rejects modified payloads", async () => {
    const signed = await signInitData({ auth_date: "1000", user: '{"id":42}' }, "123:demo");
    await expect(validateInitData(signed.replace("42", "43"), "123:demo", 1000)).rejects.toThrow("signature");
  });

  it("rejects expired and future sessions", async () => {
    const signed = await signInitData({ auth_date: "1000" }, "123:demo");
    await expect(validateInitData(signed, "123:demo", 1400, 300)).rejects.toThrow("expired");
    await expect(validateInitData(signed, "123:demo", 900, 300)).rejects.toThrow("expired");
  });
});

describe("chat commands", () => {
  it("accepts direct and correctly mentioned commands", () => {
    expect(parseCommand("/status", "creator_bot")?.name).toBe("status");
    expect(parseCommand("/status@creator_bot", "creator_bot")?.name).toBe("status");
  });

  it("ignores commands addressed to another bot", () => {
    expect(parseCommand("/status@other_bot", "creator_bot")).toBeNull();
  });

  it("authorizes admin-only commands on the server", () => {
    const base = { text: "/sync", chatType: "group" as const, botUsername: "creator_bot", adminIds: new Set([7]) };
    expect(handleCommand({ ...base, userId: 7 })?.text).toContain("requested");
    expect(handleCommand({ ...base, userId: 8 })?.text).toContain("admins");
  });

  it("returns an app action separately from message copy", () => {
    const result = handleCommand({ text: "/app", chatType: "private", userId: 1, botUsername: "creator_bot", adminIds: new Set() });
    expect(result?.openApp).toBe(true);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { admitAttempt } from "../src/model/request-admission.js";

vi.mock("node:child_process", () => ({
  execFile: vi.fn((_exe: string, _args: string[], _opts: object, cb: (err: Error) => void) => {
    cb(new Error("No verified OpenCode Go quota"));
  }),
}));

afterEach(() => vi.unstubAllEnvs());

describe("OpenCode Go Web quota preflight", () => {
  it("rejects Go model attempts before any admission or inference", async () => {
    vi.stubEnv("ZCODE_GO_WEB_QUOTA_ENFORCEMENT", "1");
    await expect(admitAttempt({
      model: { providerId: "opencode-go", modelId: "mimo-v2.6-flash" },
    })).rejects.toThrow("OpenCode Go model request denied by quota guard");
  });

  it("does not alter non-Go models", async () => {
    vi.stubEnv("ZCODE_GO_WEB_QUOTA_ENFORCEMENT", "1");
    const admission = await admitAttempt({
      model: { providerId: "local-test-provider", modelId: "any" },
    });
    expect(admission.release).toBeTypeOf("function");
  });

  it("leaves legacy behavior unchanged when server opt-in is off", async () => {
    vi.stubEnv("ZCODE_GO_WEB_QUOTA_ENFORCEMENT", "0");
    const admission = await admitAttempt({
      model: { providerId: "opencode-go", modelId: "mimo-v2.6-flash" },
    });
    expect(admission.release).toBeTypeOf("function");
  });
});

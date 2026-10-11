import { describe, it, expect } from "vitest";
import { parseReply, cap } from "./api";

describe("parseReply", () => {
  it("maps NF-201 to Plans & Pricing and strips the line", () => {
    const r = parseReply("Hello there\nSource: NF-201");
    expect(r.text).toBe("Hello there");
    expect(r.source).toBe("Source · Plans & Pricing (NF-201)");
  });
  it("maps 8xx to Coverage", () => {
    expect(parseReply("x\nSource: NF-805").source).toBe("Source · Coverage (NF-805)");
  });
  it("shows only the ID for unknown topics", () => {
    expect(parseReply("x\nSource: NF-901").source).toBe("Source · NF-901");
  });
  it("removes think blocks", () => {
    expect(parseReply("<think>secret</think>Answer").text).toBe("Answer");
  });
  it("capitalises with fallback", () => {
    expect(cap("plans", "Other")).toBe("Plans");
    expect(cap(undefined, "Medium")).toBe("Medium");
  });
});

import { describe, expect, test } from "bun:test";
import { cn, formatDate, formatRelativeTime } from "./utils";

describe("cn helper", () => {
  test("should merge basic class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  test("should filter out falsy values", () => {
    expect(cn("class1", false && "class2", null, undefined, "class3")).toBe(
      "class1 class3",
    );
  });

  test("should merge tailwind conflicts correctly using tailwind-merge", () => {
    // p-4 should override p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
    // text-red-500 should override text-blue-500
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("formatDate helper", () => {
  test("should format a date string or Date object", () => {
    const testDate = new Date("2026-06-23T12:00:00Z");
    const formatted = formatDate(testDate);
    expect(formatted).toContain("Jun");
    expect(formatted).toContain("23");
  });
});

describe("formatRelativeTime helper", () => {
  test("should format seconds ago", () => {
    const tenSecsAgo = new Date(Date.now() - 10000);
    // The diff could be 9s or 10s depending on slight cpu latency, so match regex
    expect(formatRelativeTime(tenSecsAgo)).toMatch(/^\d+s ago$/);
  });

  test("should format minutes ago", () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinsAgo)).toBe("5m ago");
  });

  test("should format hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  test("should format days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });
});

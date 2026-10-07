import { describe, expect, test } from "vitest";

import { stripObsidianComments } from "./comments.js";

describe("stripObsidianComments", () => {
  test("removes inline comments", () => {
    expect(stripObsidianComments("前%%メモ%%後")).toBe("前後");
  });

  test("removes comment-only lines together with their line breaks", () => {
    expect(stripObsidianComments("前\n  %%メモ%%\n後")).toBe("前\n後");
  });

  test("removes multi-line comment blocks", () => {
    expect(stripObsidianComments("前\n%%\nメモ\n\nメモ\n%%\n後")).toBe("前\n後");
  });

  test("handles CRLF line breaks", () => {
    expect(stripObsidianComments("前\r\n%%メモ%%\r\n後")).toBe("前\r\n後");
  });

  test("treats an unclosed comment as running to the end", () => {
    expect(stripObsidianComments("前\n%%メモ\n後")).toBe("前\n");
  });

  test("keeps text between two inline comments on the same line", () => {
    expect(stripObsidianComments("%%a%%本文%%b%%")).toBe("本文");
  });
});

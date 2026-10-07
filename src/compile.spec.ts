import { describe, expect, test } from "vitest";

import { compile } from "./compile.js";

const lines = (...rows: string[]) => `${rows.join("\n")}\n`;

describe("compile", () => {
  test("removes headings and leaves two blank lines in their place", () => {
    const input = ["## 区切り見出し", "", "テキスト", "テキスト", "", "## 区切り見出し", "", "テキスト"].join("\n");
    expect(compile(input)).toBe(lines("　テキスト", "　テキスト", "", "", "　テキスト"));
  });

  test("leaves two blank lines even when the heading had no blank lines around it", () => {
    expect(compile("「セリフ。」\n## 見出し\n「セリフ。」")).toBe(lines("「セリフ。」", "", "", "「セリフ。」"));
  });

  test("removes frontmatter", () => {
    expect(compile("---\ntitle: sample\n---\n本文。")).toBe(lines("　本文。"));
  });

  test("removes comment prefix lines without leaving blank lines", () => {
    expect(compile("一行目\n// メモ\n二行目", { commentPrefixes: ["//"] })).toBe(lines("　一行目", "　二行目"));
  });

  test("removes headings as headings even when # is a comment prefix", () => {
    expect(compile("前\n#メモ\n## 見出し\n後", { commentPrefixes: ["#"] })).toBe(lines("　前", "", "", "　後"));
  });

  test("removes %% comments", () => {
    const input = ["一行目%%インライン%%", "%%", "ブロック", "%%", "%%一行コメント%%", "「セリフ」%%メモ%%"].join("\n");
    expect(compile(input)).toBe(lines("　一行目", "", "", "「セリフ」"));
  });

  test("replaces @split with the separator", () => {
    expect(compile("前\n@split\n後", { separator: "◇" })).toBe(lines("　前", "", "", "", "◇", "", "", "", "　後"));
  });

  test("returns an empty string when nothing remains", () => {
    expect(compile("## 見出し\n%%メモ%%")).toBe("");
  });
});

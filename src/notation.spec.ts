import { describe, expect, test } from "vitest";

import { normalizeNotation } from "./notation.js";

describe("normalizeNotation", () => {
  describe("ellipses and dashes", () => {
    test.each([
      ["待って…", "待って……"],
      ["待って………", "待って…………"],
      ["待って...", "待って……"],
      ["待って・・・", "待って……"],
      ["待って……", "待って……"],
    ])("normalizes ellipses: %s", (input, expected) => {
      expect(normalizeNotation(input)).toBe(expected);
    });

    test.each([
      ["そして―", "そして──"],
      ["そして——", "そして──"],
      ["そして───", "そして────"],
      ["あーー", "あーー"],
    ])("normalizes dashes: %s", (input, expected) => {
      expect(normalizeNotation(input)).toBe(expected);
    });
  });

  describe("exclamation and question marks", () => {
    test("converts half-width marks after Japanese text", () => {
      expect(normalizeNotation("「え!?」")).toBe("「え！？」");
    });

    test("keeps half-width marks in ASCII text", () => {
      expect(normalizeNotation("Hello!")).toBe("Hello!");
    });

    test("inserts a full-width space when text follows", () => {
      expect(normalizeNotation("「また魔物？最近多くない？」")).toBe("「また魔物？　最近多くない？」");
    });

    test("replaces a half-width space after a mark with a full-width space", () => {
      expect(normalizeNotation("また魔物? 最近多くない?")).toBe("また魔物？　最近多くない？");
    });

    test.each([
      ["「え！？」", "「え！？」"],
      ["「え！！」", "「え！！」"],
      ["「え？　」", "「え？」"],
      ["「え？……」", "「え？……」"],
      ["「え！！（なんで）」", "「え！！（なんで）」"],
      ["「さん！\"ウチの魔術師\"に」", "「さん！\"ウチの魔術師\"に」"],
    ])("does not insert a space before marks or brackets: %s", (input, expected) => {
      expect(normalizeNotation(input)).toBe(expected);
    });

    test.each([
      ["「さん！　\"ウチの魔術師\"に」", "「さん！　\"ウチの魔術師\"に」"],
      ["「ぬいぬい？ ……ああ」", "「ぬいぬい？　……ああ」"],
    ])("keeps an existing space after a mark as a full-width space: %s", (input, expected) => {
      expect(normalizeNotation(input)).toBe(expected);
    });
  });

  describe("spaces", () => {
    test("removes spaces between Japanese characters", () => {
      expect(normalizeNotation("そして、 見つけた　　んだ")).toBe("そして、見つけたんだ");
    });

    test("removes spaces around emphasis quotes", () => {
      expect(normalizeNotation("あれが \"ウチの魔術師\" か")).toBe("あれが\"ウチの魔術師\"か");
    });

    test("keeps spaces after symbols such as ♡", () => {
      expect(normalizeNotation("『甘やかしてあげる♡　膝枕』")).toBe("『甘やかしてあげる♡　膝枕』");
    });

    test("keeps spaces in ASCII text and next to it", () => {
      expect(normalizeNotation("Hello World と iPhone 15 を")).toBe("Hello World と iPhone 15 を");
    });
  });

  describe("periods", () => {
    test.each([
      ["「はい。」", "「はい」"],
      ["（はい。）", "（はい）"],
      ["『はい。』", "『はい』"],
      ["待って……。", "待って……"],
      ["行くぞ！。", "行くぞ！"],
      ["本当？。", "本当？"],
    ])("removes redundant periods: %s", (input, expected) => {
      expect(normalizeNotation(input)).toBe(expected);
    });
  });

  describe("characters", () => {
    test("converts full-width digits to half-width", () => {
      expect(normalizeNotation("５メートル")).toBe("5メートル");
    });

    test("does not convert numbers to kanji", () => {
      expect(normalizeNotation("5メートル")).toBe("5メートル");
    });

    test("converts curly quotes to half-width quotes", () => {
      expect(normalizeNotation("“ウチの魔術師”")).toBe("\"ウチの魔術師\"");
    });

    test("converts half-width parentheses containing Japanese text", () => {
      expect(normalizeNotation("(やっぱ詰みか…)")).toBe("（やっぱ詰みか……）");
    });

    test("keeps half-width parentheses without Japanese text", () => {
      expect(normalizeNotation("候補(A)を選ぶ")).toBe("候補(A)を選ぶ");
    });
  });

  test("does not change inline comments", () => {
    expect(normalizeNotation("待って…%%メモ… です。」%%行く!")).toBe("待って……%%メモ… です。」%%行く！");
  });
});

import { describe, expect, test } from "vitest";

import { format } from "./format.js";

const lines = (...rows: string[]) => `${rows.join("\n")}\n`;

describe("format", () => {
  describe("narration", () => {
    test("breaks lines after 。 and indents each paragraph", () => {
      expect(format("一文目。二文目。")).toBe(lines("　一文目。", "　二文目。"));
    });

    test("does not break before a closing bracket", () => {
      expect(format("彼は「はい。」と言った。")).toBe(lines("　彼は「はい」と言った。"));
    });
  });

  describe("dialogue", () => {
    test("does not break lines on 。 inside dialogue", () => {
      expect(format("「セリフ。セリフ」")).toBe(lines("「セリフ。セリフ」"));
    });

    test("ensures two blank lines between narration and dialogue", () => {
      expect(format("地の文。\n「セリフ」\n地の文。")).toBe(lines("　地の文。", "", "", "「セリフ」", "", "", "　地の文。"));
    });

    test("normalizes multiple blank lines around dialogue to exactly two", () => {
      expect(format("地の文。\n\n\n\n「セリフ」\n\n\n地の文。")).toBe(
        lines("　地の文。", "", "", "「セリフ」", "", "", "　地の文。"),
      );
    });

    test("removes blank lines between dialogue lines", () => {
      expect(format("「セリフ1」\n\n\n「セリフ2」")).toBe(lines("「セリフ1」", "「セリフ2」"));
    });

    test("treats a line with a trailing inline comment as dialogue", () => {
      expect(format("「セリフ」%%メモ%%")).toBe(lines("「セリフ」%%メモ%%"));
    });
  });

  describe("blank lines", () => {
    test("normalizes existing blank lines to two and does not add new ones", () => {
      expect(format("一行目\n\n二行目\n三行目")).toBe(lines("　一行目", "", "", "　二行目", "　三行目"));
    });

    test("does not output leading blank lines", () => {
      expect(format("\n\n本文")).toBe(lines("　本文"));
    });

    test("returns an empty string for empty input", () => {
      expect(format("")).toBe("");
    });
  });

  describe("headings", () => {
    test("keeps headings without indent and puts two blank lines around them", () => {
      expect(format("## 見出し\nテキスト\nテキスト\n## 見出し\n「セリフ」")).toBe(
        lines("## 見出し", "", "", "　テキスト", "　テキスト", "", "", "## 見出し", "", "", "「セリフ」"),
      );
    });

    test("normalizes extra blank lines around headings to two", () => {
      expect(format("テキスト\n\n\n\n\n## 見出し\n\n\n\n\nテキスト")).toBe(
        lines("　テキスト", "", "", "## 見出し", "", "", "　テキスト"),
      );
    });

    test("prefers headings over comment prefixes", () => {
      expect(format("## 見出し\n#メモ\n本文", { commentPrefixes: ["#"] })).toBe(
        lines("## 見出し", "#メモ", "", "", "　本文"),
      );
    });
  });

  describe("separators", () => {
    test("puts three blank lines around separators", () => {
      expect(format("前。\n＊＊＊\n後。")).toBe(lines("　前。", "", "", "", "＊＊＊", "", "", "", "　後。"));
    });

    test("separator wins over heading spacing", () => {
      expect(format("## 見出し\n＊＊＊\nテキスト")).toBe(lines("## 見出し", "", "", "", "＊＊＊", "", "", "", "　テキスト"));
    });

    test("uses a custom separator", () => {
      expect(format("前\n◇\n後", { separator: "◇" })).toBe(lines("　前", "", "", "", "◇", "", "", "", "　後"));
    });

    test("treats headings with @split as section breaks", () => {
      expect(format("前\n## 翌朝@split\n後")).toBe(lines("　前", "", "", "", "## 翌朝@split", "", "", "", "　後"));
    });

    test("keeps @split markers as section breaks", () => {
      expect(format("前\n@split\n後")).toBe(lines("　前", "", "", "", "@split", "", "", "", "　後"));
    });
  });

  describe("multi-line quotes", () => {
    test("keeps lines of a multi-line 『』 together without indent", () => {
      expect(format("地の文。\n『一行目。\n二行目。\n三行目』\n地の文。")).toBe(
        lines("　地の文。", "", "", "『一行目。", "二行目。", "三行目』", "", "", "　地の文。"),
      );
    });

    test("does not treat narration starting with a closed 『』 as a quote", () => {
      expect(format("『本』を読んだ。\n地の文。")).toBe(lines("　『本』を読んだ。", "　地の文。"));
    });

    test("ends an unclosed 『 at a blank line", () => {
      expect(format("『閉じ忘れ\n\n地の文。")).toBe(lines("『閉じ忘れ", "", "", "　地の文。"));
    });
  });

  describe("narration gap markers", () => {
    const withMarker = (first: string, second: string) =>
      lines(first, "", "", "%%地の文%%", "", "", second);

    test.each([
      ["（心中1）\n（心中2）", ["（心中1）", "（心中2）"]],
      ["（心中）\n「セリフ」", ["（心中）", "「セリフ」"]],
      ["「セリフ」\n（心中）", ["「セリフ」", "（心中）"]],
    ])("inserts a marker surrounded by two blank lines: %s", (input, [first, second]) => {
      expect(format(input)).toBe(withMarker(first!, second!));
    });

    test("inserts a marker even when blank lines separate them", () => {
      expect(format("（心中）\n\n\n「セリフ」")).toBe(withMarker("（心中）", "「セリフ」"));
    });

    test("does not insert a marker between セリフ lines", () => {
      expect(format("「セリフ1」\n「セリフ2」")).toBe(lines("「セリフ1」", "「セリフ2」"));
    });

    test("does not insert a marker next to 『』", () => {
      expect(format("『表示』\n（心中）\n『表示』")).toBe(lines("『表示』", "（心中）", "『表示』"));
    });

    test("does not insert a marker when narration separates them", () => {
      expect(format("（心中）\n地の文。\n「セリフ」")).toBe(
        lines("（心中）", "", "", "　地の文。", "", "", "「セリフ」"),
      );
    });

    test("does not insert a marker when a comment already separates them", () => {
      expect(format("（心中）\n%%あとで直す%%\n「セリフ」")).toBe(lines("（心中）", "%%あとで直す%%", "「セリフ」"));
    });

    test("does not add another marker when formatting again", () => {
      const once = format("（心中）\n「セリフ」");
      expect(format(once)).toBe(once);
    });

    test("uses a custom marker", () => {
      expect(format("（心中）\n「セリフ」", { narrationGapMarker: "%%TODO%%" })).toBe(
        lines("（心中）", "", "", "%%TODO%%", "", "", "「セリフ」"),
      );
    });

    test("keeps two blank lines around a marker already in the text", () => {
      const text = lines("（心中）", "", "", "%%地の文%%", "", "", "「セリフ」");
      expect(format(lines("（心中）", "%%地の文%%", "「セリフ」"))).toBe(text);
    });

    test("treats a marker inside a %% comment block as part of the comment", () => {
      expect(format("本文。\n%%\n%%地の文%%\n%%")).toBe(lines("　本文。", "%%", "%%地の文%%", "%%"));
    });

    test("inserts no marker when narrationGapMarker is empty", () => {
      expect(format("（心中）\n「セリフ」", { narrationGapMarker: "" })).toBe(lines("（心中）", "「セリフ」"));
    });
  });

  describe("notation", () => {
    test("normalizes notation in narration and dialogue", () => {
      expect(format("待って…\n「え!? 本当？。」")).toBe(lines("　待って……", "", "", "「え！？　本当？」"));
    });

    test("does not change headings and comments", () => {
      expect(format("## 見出し…\n// メモ…\n%%\nメモ…\n%%", { commentPrefixes: ["//"] })).toBe(
        lines("## 見出し…", "// メモ…", "%%", "メモ…", "%%"),
      );
    });
  });

  describe("trailer", () => {
    test("keeps the MOC section unchanged", () => {
      expect(format("本文。\n## MOC\n- Relateds\n    - [[ノート]]\n\n- References\n")).toBe(
        lines("　本文。", "", "", "## MOC", "- Relateds", "    - [[ノート]]", "", "- References"),
      );
    });

    test("uses a custom trailer heading", () => {
      expect(format("本文。\n# メモ\n書きかけ。", { trailerHeading: "メモ" })).toBe(
        lines("　本文。", "", "", "# メモ", "書きかけ。"),
      );
    });

    test("does not treat MOC as a trailer when trailerHeading is empty", () => {
      expect(format("## MOC\n本文", { trailerHeading: "" })).toBe(lines("## MOC", "", "", "　本文"));
    });
  });

  describe("comments", () => {
    test("keeps comment prefix lines unchanged", () => {
      expect(format("本文。\n  // 字下げしない\n// メモ。メモ。", { commentPrefixes: ["//"] })).toBe(
        lines("　本文。", "　// 字下げしない", "// メモ。メモ。"),
      );
    });

    test("keeps multi-line %% comment blocks unchanged", () => {
      expect(format("本文。\n%%\nメモ。メモ。\n\n  メモ\n%%\n本文。")).toBe(
        lines("　本文。", "%%", "メモ。メモ。", "", "  メモ", "%%", "　本文。"),
      );
    });

    test("does not break lines on 。 inside inline comments", () => {
      expect(format("一文目。%%メモ。メモ%%二文目。")).toBe(lines("　一文目。", "　%%メモ。メモ%%二文目。"));
    });
  });

  describe("frontmatter", () => {
    test("keeps frontmatter and puts one blank line before the body", () => {
      expect(format("---\ntitle: sample\n---\n\n\n本文。")).toBe("---\ntitle: sample\n---\n\n　本文。\n");
    });

    test("keeps frontmatter when the body is empty", () => {
      expect(format("---\ntitle: sample\n---")).toBe("---\ntitle: sample\n---\n");
    });
  });
});

import { describe, expect, test } from "vitest";

import { preprocessMarkdown } from "./preprocess";

describe("preprocessMarkdown", () => {
  // ---- @split キーワード -----------------------------------------------------

  describe("@split keyword", () => {
    test("replaces a line containing @split with the default separator", () => {
      const input = "第一章\n@split\n第二章";
      const out = preprocessMarkdown(input);
      expect(out).toBe("第一章\n＊＊＊\n第二章");
    });

    test("replaces @split even when it appears mid-line with other text", () => {
      const input = "@split ここから新章";
      const out = preprocessMarkdown(input);
      expect(out).toBe("＊＊＊");
    });

    test("uses a custom separator when provided", () => {
      const input = "本文\n@split\n本文2";
      const out = preprocessMarkdown(input, "---");
      expect(out).toBe("本文\n---\n本文2");
    });

    test("replaces multiple @split lines independently", () => {
      const input = "A\n@split\nB\n@split\nC";
      const out = preprocessMarkdown(input);
      expect(out).toBe("A\n＊＊＊\nB\n＊＊＊\nC");
    });
  });

  // ---- リストの平坦化 --------------------------------------------------------

  describe("list flattening", () => {
    test("strips list marker from a leaf item (no children)", () => {
      const input = "- セリフ本文";
      const out = preprocessMarkdown(input);
      expect(out).toBe("セリフ本文");
    });

    test("strips * marker from a leaf item", () => {
      const input = "* セリフ本文";
      const out = preprocessMarkdown(input);
      expect(out).toBe("セリフ本文");
    });

    test("skips parent list items (item that has indented children)", () => {
      const input = "- 親\n  - 子";
      const out = preprocessMarkdown(input);
      expect(out).toBe("子");
    });

    test("handles two-level nesting: grandparent and parent are skipped", () => {
      const input = "- 祖父\n  - 親\n    - 子";
      const out = preprocessMarkdown(input);
      expect(out).toBe("子");
    });

    test("keeps sibling leaf items when a parent is present", () => {
      const input = "- 親\n  - 子A\n  - 子B";
      const out = preprocessMarkdown(input);
      expect(out).toBe("子A\n子B");
    });

    test("multiple top-level leaves are all kept", () => {
      const input = "- 葉A\n- 葉B\n- 葉C";
      const out = preprocessMarkdown(input);
      expect(out).toBe("葉A\n葉B\n葉C");
    });
  });

  // ---- グループ間の空行 (親の境界) ------------------------------------------

  describe("blank lines between parent groups", () => {
    test("case1: inserts exactly 2 blank lines between sibling parent groups", () => {
      const input = [
        "- 親",
        "    - 子",
        "    - 子",
        "- 親",
        "    - 子",
      ].join("\n");
      const out = preprocessMarkdown(input);
      expect(out).toBe("子\n子\n\n\n子");
    });

    test("case2: strips trailing/leading empty items and inserts exactly 2 blank lines", () => {
      const input = [
        "- 親",
        "    - 子",
        "    - 子",
        "    - ",
        "    - ",
        "- 親",
        "    - ",
        "    - ",
        "    - 子",
      ].join("\n");
      const out = preprocessMarkdown(input);
      expect(out).toBe("子\n子\n\n\n子");
    });

    test("case3: preserves inner blank lines, strips boundary empty items, enforces exactly 2 blank lines", () => {
      const input = [
        "- 親",
        "    - 子",
        "    - ",
        "    - 子",
        "    - 親との境界のところだけ空行を無視",
        "    - すでに２つ以上あっても、必ず空行を２つにする",
        "    - ",
        "    - ",
        "    - ",
        "- 親",
        "    - ",
        "    - ",
        "    - 子",
      ].join("\n");
      const out = preprocessMarkdown(input);
      expect(out).toBe(
        [
          "子",
          "",
          "子",
          "親との境界のところだけ空行を無視",
          "すでに２つ以上あっても、必ず空行を２つにする",
          "",
          "",
          "子",
        ].join("\n")
      );
    });
  });

  // ---- 通常テキスト ----------------------------------------------------------

  describe("plain text passthrough", () => {
    test("non-list lines are passed through unchanged", () => {
      const input = "地の文。\n「セリフ。」";
      const out = preprocessMarkdown(input);
      expect(out).toBe("地の文。\n「セリフ。」");
    });

    test("empty lines are preserved", () => {
      const input = "第一段落\n\n第二段落";
      const out = preprocessMarkdown(input);
      expect(out).toBe("第一段落\n\n第二段落");
    });

    test("empty input returns empty string", () => {
      expect(preprocessMarkdown("")).toBe("");
    });
  });

  // ---- 複合ケース ------------------------------------------------------------

  describe("combined scenarios", () => {
    test("mix of plain text, list, and @split", () => {
      const input = [
        "まえがき",
        "- 章タイトル",
        "  - セリフ一行目",
        "  - セリフ二行目",
        "@split",
        "第二幕",
      ].join("\n");

      const out = preprocessMarkdown(input);

      expect(out).toBe(
        ["まえがき", "セリフ一行目", "セリフ二行目", "＊＊＊", "第二幕"].join("\n")
      );
    });
  });
});

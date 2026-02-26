import { describe, expect, test } from "vitest";

import { processNovelLines, reconstructNovelText } from "./helpers";

describe("format novel text", () => {
  test("does not break lines on 。 inside dialogue", () => {
    const body = "地の文。\n「セリフ。セリフ。」\n地の文。";

    const processed = processNovelLines(body);
    const out = reconstructNovelText(processed);

    expect(out).toContain("「セリフ。セリフ。」\n");
    expect(out).not.toContain("「セリフ。\n");
  });

  test("ensures two blank lines between narration and dialogue", () => {
    const body = "地の文。\n「セリフ。」\n地の文。";

    const processed = processNovelLines(body);
    const out = reconstructNovelText(processed);

    expect(out).toBe("　地の文。\n\n\n「セリフ。」\n\n\n　地の文。\n");
  });

  test("normalizes multiple blank lines around dialogue to exactly two", () => {
    const body = "地の文。\n\n\n\n「セリフ。」\n\n\n地の文。";

    const processed = processNovelLines(body);
    const out = reconstructNovelText(processed);

    expect(out).toBe("　地の文。\n\n\n「セリフ。」\n\n\n　地の文。\n");
  });

  test("removes blank lines between dialogue lines", () => {
    const body = "「セリフ1。」\n\n\n「セリフ2。」";

    const processed = processNovelLines(body);
    const out = reconstructNovelText(processed);

    expect(out).toBe("「セリフ1。」\n「セリフ2。」\n");
  });
});

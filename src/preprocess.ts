import { SECTION_SEPARATOR } from "./constants";

/**
 * リスト構造と@splitサフィックスを処理するためにMarkdownテキストを前処理します。
 * - 親アイテムを削除してリストをフラット化します。
 * - @splitサフィックスを持つ行をセパレータに置換します。
 * - リーフアイテムからリストマーカーを除去します。
 * - 兄弟関係にある親グループの間に、正確に2つの空行を挿入します。
 * - 空のリーフアイテム（内容のない"- "）は、グループ内の空行になります。
 * - グループ内の先頭/末尾の空のリーフアイテムは削除されます。
 */
export function preprocessMarkdown(body: string, separator: string = SECTION_SEPARATOR): string {
  const rawLines = body.split(/\r\n|\n|\r/);

  // ---- ステップ 1: 各行に注釈を付ける ----
  const meta = rawLines.map(raw => {
    const indent = raw.match(/^(\s*)/)?.[1]?.length ?? 0;
    const trimmed = raw.trim();
    const isBlank = trimmed === "";
    const hasSplit = !isBlank && trimmed.includes("@split");
    // "- text"、"- "、"-"、"* text"、"* "、"*" にマッチします
    const listMatch = !hasSplit ? trimmed.match(/^[-*](\s(.*))?$/) : null;
    const isList = listMatch !== null;
    // リストマーカーの後の内容。nullはアイテムが空であることを意味します
    const listContent = isList ? (listMatch![2]?.trim() || null) : null;
    return { raw, indent, trimmed, isBlank, hasSplit, isList, listContent };
  });

  // ---- ステップ 2: 親の検出 ----
  // 次の空行でないリストアイテムがより深くインデントされている場合、そのリストアイテムは「親」です。
  function isParent(idx: number): boolean {
    const cur = meta[idx]!;
    for (let j = idx + 1; j < meta.length; j++) {
      const nxt = meta[j]!;
      if (nxt.isBlank) continue;
      if (nxt.isList && nxt.indent > cur.indent) return true;
      break;
    }
    return false;
  }

  // ---- ステップ 3: 処理 ----
  const resultLines: string[] = [];

  // 現在の親グループバッファ。
  // nullエントリ = 空行（空のリーフアイテム、またはリストブロック内の空行から）。
  let groupBuffer: Array<string | null> | null = null;
  // すでに少なくとも1つのリストグループをresultLinesに出力したかどうか。
  let hadPreviousGroup = false;

  function flushGroup() {
    if (groupBuffer === null) return;

    // 先頭の空エントリを削除
    let a = 0;
    while (a < groupBuffer.length && groupBuffer[a] === null) a++;
    // 末尾の空エントリを削除
    let b = groupBuffer.length - 1;
    while (b >= a && groupBuffer[b] === null) b--;

    const trimmed = groupBuffer.slice(a, b + 1);
    groupBuffer = null;

    if (trimmed.length === 0) return;

    if (hadPreviousGroup) {
      // グループの間に正確に2つの空行を挿入
      resultLines.push("", "");
    }
    for (const entry of trimmed) {
      resultLines.push(entry ?? "");
    }
    hadPreviousGroup = true;
  }

  for (let i = 0; i < meta.length; i++) {
    const line = meta[i]!;

    // @split: 開いているグループをフラッシュし、セパレータを出力
    if (line.hasSplit) {
      flushGroup();
      hadPreviousGroup = false;
      resultLines.push(separator);
      continue;
    }

    // 親リストアイテム: 新しいグループを開始（前のグループはフラッシュ）
    if (line.isList && isParent(i)) {
      flushGroup();
      groupBuffer = [];
      continue;
    }

    // リーフリストアイテム（空の可能性あり）
    if (line.isList) {
      if (groupBuffer === null) {
        // 先行する親がないリーフ — 独自のグループとして扱う
        groupBuffer = [];
      }
      groupBuffer.push(line.listContent); // null for empty, string for content
      continue;
    }

    // リストグループ内の空行 → グループ内の空のエントリになる
    if (line.isBlank && groupBuffer !== null) {
      groupBuffer.push(null);
      continue;
    }

    // 通常の非リスト行: 開いているグループをフラッシュし、そのまま渡す
    flushGroup();
    hadPreviousGroup = false;
    resultLines.push(line.raw);
  }

  flushGroup();

  return resultLines.join("\n");
}

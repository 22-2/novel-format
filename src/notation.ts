import { findInlineComments } from "./comments.js";

/** 和文の文字（ASCII と空白以外）。半角の `!` `?` を全角にするかの判定に使う */
const JAPANESE_CHAR = String.raw`[^\x00-\x7F\s]`;

/**
 * 間の空白を詰める文字。漢字・かな・長音と和文の約物に加えて、強調に使う半角の `"` も含める。
 * 理由: `が "ウチの魔術師" と` のように、引用符の外側に空白を入れた書き方も詰めるため。
 * `♡` などの記号は含めない。表示文言で記号の後に区切りの空白を入れることがあるため。
 */
const SPACE_NEIGHBOR = String.raw`[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー、-〿（）！？…─"]`;

/**
 * 和文の文字にはさまれた空白（半角・全角）。
 * `！` `？` の後の空白は書き手が文の区切りとして入れたものなので、ここでは詰めない。
 */
const SPACES_IN_JAPANESE_PATTERN = new RegExp(
  String.raw`(?<=${SPACE_NEIGHBOR})(?<![！？])[ 　]+(?=${SPACE_NEIGHBOR})`,
  "gu",
);

/** `！` `？` の後の空白のうち、記号の連続や閉じ括弧の直前、行末にあって不要なもの */
const SPACES_BEFORE_CLOSER_PATTERN = /(?<=[！？])[ 　]+(?=[！？」』）]|$)/g;

/** `！` `？` の後の空白。全角一字にそろえる */
const SPACES_AFTER_MARK_PATTERN = /(?<=[！？])[ 　]+/g;

/**
 * `！` `？` の直後に文字（漢字・かな・英数字）が続く位置。全角スペースを一字入れる。
 * 記号の連続（`！！` `？……`）、閉じ括弧、開き括弧、`"` の前には入れない。
 * 理由: `"` は開きか閉じか区別できず、開き括弧の前は下書きでも空白を入れていないため。
 */
const MARK_FOLLOWED_BY_TEXT_PATTERN = /(?<=[！？])(?=[\p{L}\p{N}])/gu;

/** 和文の文字に続く半角の `!` `?` */
const HALF_WIDTH_MARKS_PATTERN = new RegExp(String.raw`(?<=${JAPANESE_CHAR})[!?]+`, "g");

/** 和文を含む半角カッコ。`(A)` のような英数字だけのカッコは変えない */
const HALF_WIDTH_PARENS_PATTERN = /\(([^()]*[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}][^()]*)\)/gu;

/**
 * 地の文とセリフの記号・表記を、小説の書式ルールにそろえる。
 * `%%…%%` の中は変えない。
 * - 全角の算用数字を半角にする（漢数字にするかは書き手が判断するため変えない）
 * - `“”` を半角の `"` にする
 * - 和文を含む半角カッコを全角の `（）` にする
 * - 和文に続く半角の `!` `?` を全角にする
 * - 三点リーダーを `……`、ダッシュを `──` にし、偶数個にそろえる
 * - 閉じ括弧の直前と、`…` `！` `？` の直後の句点を取り除く
 * - 和文の中の空白を取り除き、文中の `！` `？` の後には全角スペースを一字入れる
 */
export function normalizeNotation(text: string): string {
  const comments = findInlineComments(text);
  if (comments.length === 0) return normalizeSegment(text);

  let result = "";
  let cursor = 0;
  for (const [start, end] of comments) {
    result += normalizeSegment(text.slice(cursor, start)) + text.slice(start, end);
    cursor = end;
  }
  return result + normalizeSegment(text.slice(cursor));
}

function normalizeSegment(text: string): string {
  return [
    toHalfWidthDigits,
    (s: string) => s.replace(/[“”]/g, '"'),
    (s: string) => s.replace(HALF_WIDTH_PARENS_PATTERN, "（$1）"),
    (s: string) => s.replace(HALF_WIDTH_MARKS_PATTERN, toFullWidthMarks),
    normalizeEllipses,
    normalizeDashes,
    // `！。` の句点が `！` の後の文とみなされて空白が入らないよう、空白をそろえる前に取り除く
    removeRedundantPeriods,
    normalizeSpaces,
  ].reduce((result, normalize) => normalize(result), text);
}

function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
}

function toFullWidthMarks(marks: string): string {
  return marks.replace(/!/g, "！").replace(/\?/g, "？");
}

/**
 * `...` `・・・` と `…` の連なりを `……` の偶数個にする。
 * 半角ピリオドと中黒は三つで `…` 一つとみなす。
 */
function normalizeEllipses(text: string): string {
  return text
    .replace(/\.{3,}|・{3,}/g, (dots) => "…".repeat(Math.ceil(dots.length / 3)))
    .replace(/…+/g, (ellipsis) => "…".repeat(roundUpToEven(ellipsis.length)));
}

/**
 * `―`（ホリゾンタルバー）、`—`（エムダッシュ）、`─`（罫線）の連なりを `──` の偶数個にする。
 * 長音の `ー` や半角の `-` は、ダッシュとして使っているか区別できないため変えない。
 */
function normalizeDashes(text: string): string {
  return text.replace(/[―—─]+/g, (dashes) => "─".repeat(roundUpToEven(dashes.length)));
}

function roundUpToEven(length: number): number {
  return length % 2 === 0 ? length : length + 1;
}

function removeRedundantPeriods(text: string): string {
  return text.replace(/。+(?=[」』）])/g, "").replace(/(?<=[…！？])。+/g, "");
}

function normalizeSpaces(text: string): string {
  return text
    .replace(SPACES_IN_JAPANESE_PATTERN, "")
    .replace(SPACES_BEFORE_CLOSER_PATTERN, "")
    .replace(SPACES_AFTER_MARK_PATTERN, "　")
    .replace(MARK_FOLLOWED_BY_TEXT_PATTERN, "　");
}

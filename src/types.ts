export interface FormatOptions {
  /**
   * 区切り記号。この文字列を含む行は区切り行として扱い、前後を空行3つにそろえる。
   * デフォルト: SECTION_SEPARATOR（`＊＊＊`）
   */
  separator?: string;
  /**
   * 行頭がいずれかの文字列で始まる行をコメント行として扱う。
   * format では手を加えずに残し、compile では除去する。
   * 行頭の空白は除去せずに判定する。見出し（`# 見出し`）はこの設定より優先される。
   * デフォルト: []
   */
  commentPrefixes?: string[];
  /**
   * 本文の終わりを示す見出しの名前。この名前の見出し（`## MOC` など）から後ろは本文として扱わない。
   * format では手を加えずに残し、compile では除去する。空文字を指定すると無効になる。
   * デフォルト: TRAILER_HEADING（`MOC`）
   */
  trailerHeading?: string;
  /**
   * 心中（`（）`）とセリフ（`「」`）が地の文を挟まずに連続する位置に挟む目印。
   * format だけで使い、compile では挟まない。空文字を指定すると挟まない。
   * 直前にコメント行がある位置には挟まないので、整形を繰り返しても増えない。
   * デフォルト: NARRATION_GAP_MARKER（`%%地の文%%`）
   */
  narrationGapMarker?: string;
}

export type CompileOptions = FormatOptions;

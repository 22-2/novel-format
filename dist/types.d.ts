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
     * セリフが連続するとき、元テキストの空行を保持するかどうか。
     * デフォルト: false（セリフ同士の間の空行は詰める）
     */
    preserveDialogueSpacing?: boolean;
}
export type CompileOptions = FormatOptions;

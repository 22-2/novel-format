
export interface ProcessedLine {
  text: string;
  isDialogue: boolean;
  /** 直前の連続空行数（0以上） */
  precedingEmptyLineCount: number;
  isSeparator: boolean;
}

export interface FormatNovelTextOptions {
  /**
   * セパレータ文字列。
   * 元テキストにこの文字列を含む行があれば、段落区切りとして認識します。
   * セパレータ行の前後は「空行3つ」に正規化されます。
   */
  separator?: string;
  /**
   * セリフ同士が連続する場合に、元テキストの空行を保持するかどうか。
   * デフォルト: false（セリフ間の余分な空行は詰められる）
   */
  preserveDialogueSpacing?: boolean;
}

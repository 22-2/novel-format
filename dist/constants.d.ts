/** デフォルトの区切り記号。この文字列を含む行は区切り行として扱う */
export declare const SECTION_SEPARATOR = "\uFF0A\uFF0A\uFF0A";
/** 原稿中で区切りを示す目印。format では残し、compile では区切り記号に置き換える */
export declare const SPLIT_MARKER = "@split";
/** デフォルトの本文の終わりを示す見出しの名前。この見出しから後ろは本文として扱わない */
export declare const TRAILER_HEADING = "MOC";
/** デフォルトの目印。心中とセリフが地の文を挟まずに連続する位置に、format が挟むコメント */
export declare const NARRATION_GAP_MARKER = "%%\u5730\u306E\u6587%%";

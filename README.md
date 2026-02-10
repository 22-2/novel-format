# @22-2/novel-format

Text formatting utilities for novels (formatting, markdown helpers)

## Usage

Install from Git:

pnpm add git+https://github.com/22-2/novel-format.git

Then in TypeScript/JS:

import { formatNovelTextCore } from "@22-2/novel-format";

## Build

This package uses TypeScript. When installed via Git, the `prepare` script runs to build `dist` automatically.

pnpm install
pnpm build
## フォーマット仕様 (日本語小説向け)

以下はこのパッケージが行う本文フォーマットの概要です。主に日本語小説のプレーンテキスト／Markdown本文を読みやすい小説形式に整形します。

- Frontmatter の維持: Markdown に YAML frontmatter (--- で囲まれたブロック) がある場合、本文だけを整形してから frontmatter を先頭に復元します。
- セクション区切り: デフォルトのセパレータ文字列は SECTION_SEPARATOR です。元テキストの行にこの文字列が含まれている行は「セクション区切り」として扱い、前後を空行3つに正規化します。オプションで FormatNovelTextOptions.separator により変更可能です。
- セリフの判定: 行の先頭が「、『、（ のいずれかで始まる行は「セリフ」と見なします。セリフ行は句点による改行分割や字下げの対象外です。
- 句点での改行: セリフでない行は 。 のあとで改行して段落を分割します（句点が連続して改行済みの場合はそのまま）。
- 字下げ: セリフ以外の各段落は全角スペース1文字で字下げ（例: 　本文）します。セリフは字下げしません。
- 空行の正規化:
  - セクション区切りの前後は空行3つ。
  - セリフと地の文（通常文）の境目は空行2つ。
  - セリフ同士が連続する場合は追加の空行は挟みません。

### オプション

- separator (string) — セクション区切りとして認識する文字列を変更できます。省略時は SECTION_SEPARATOR を使用。

### 例（簡易）

入力（抜粋）:

---
title: サンプル
---

これは本文です。続けます。
「こんにちは」彼は言った。
♦️◆♦️◆♦️◆

出力（抜粋）:

---
title: サンプル
---

　これは本文です。

　続けます。

「こんにちは」彼は言った。



　（次のセクションの本文）

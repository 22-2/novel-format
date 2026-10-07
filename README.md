# @22-2/novel-format

日本語小説の原稿を整形するライブラリです。Obsidian などで書いた Markdown 原稿を前提にしています。

- `format`: 原稿を小説形式に整えます。行は削除しません。原稿ファイルを書き換える用途向けです。
- `compile`: 執筆用の要素（見出し・コメント・フロントマターなど）を取り除き、そのまま投稿できるテキストにします。

## インストール

```sh
pnpm add github:22-2/novel-format#2.0.0
```

## 使い方

```ts
import { compile, format } from "@22-2/novel-format";

const formatted = format(text, { commentPrefixes: ["//"] });
const publishable = compile(text, { commentPrefixes: ["//"] });
```

### 例

原稿:

```md
---
title: サンプル
---

## 区切り見出し

テキスト。続き。
%%あとで直す%%

「セリフ」
@split
## 区切り見出し
テキスト
```

`format` の結果:

```md
---
title: サンプル
---

## 区切り見出し


　テキスト。
　続き。
%%あとで直す%%


「セリフ」



@split



## 区切り見出し


　テキスト
```

`compile` の結果:

```md
　テキスト。
　続き。


「セリフ」



＊＊＊



　テキスト
```

## 整形ルール

`format` と `compile` に共通のルールです。

- 地の文: 句点（`。`）のあとで改行し、全角スペースで字下げします。閉じカッコ（`」』）`）が続く句点では改行しません。
- セリフ: `「」`・`『』`・`（）` で始まり対応する閉じカッコで終わる行です。改行も字下げもしません。
- 空行（上にあるものほど優先）:
  1. 区切り行の前後は空行3つ
  2. 見出しの前後は空行2つ
  3. セリフ同士の間は空行なし（`preserveDialogueSpacing` で元の空行数を保持）
  4. セリフと地の文の境目は空行2つ
  5. それ以外は、元の空行があれば空行2つ、なければ空行なし

### `format` だけのルール

- フロントマター、見出し（`#` 〜 `######` + 空白）、区切り記号、`@split` は残します。見出しは字下げしません。
- コメント（`%%…%%` と `commentPrefixes` で始まる行）は手を加えずに残します。
  - コメント行の前の空行数も元のまま残します。
  - 行の中の `%%…%%` に含まれる句点では改行しません。

### `compile` だけのルール

- フロントマターを除去します。
- `%%…%%` を除去します。コメントだけの行は行ごと消えます。
- `commentPrefixes` で始まる行を除去します。
- 見出しを除去し、その位置を空行2つにします。
- `@split` を区切り記号に置き換えます。

## オプション

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `separator` | `string` | `SECTION_SEPARATOR`（`＊＊＊`） | この文字列を含む行を区切り行として扱います。`compile` では `@split` をこの文字列に置き換えます。 |
| `commentPrefixes` | `string[]` | `[]` | 行頭がいずれかで始まる行をコメント行として扱います。行頭の空白は除去せずに判定します。見出しはこの設定より優先されるので、`#` を指定しても `## 見出し` はコメントになりません。 |
| `preserveDialogueSpacing` | `boolean` | `false` | セリフ同士の間の空行を元のまま保持します。 |

## 1.x からの移行

- `format` の `ignoreLinePrefixes` は廃止しました。行を除去したい場合は `compile` の `commentPrefixes` を使ってください。`format` に渡した `commentPrefixes` の行は除去されず、そのまま残ります。
- `@split` の変換は `compile` が行います。
- `preprocessMarkdown` は非推奨です（リストの平坦化は今後使わない予定です）。
- `ProcessedLine` 型と `FormatNovelTextOptions` 型の公開をやめました。オプションの型は `FormatOptions` / `CompileOptions` です。

## 開発

```sh
pnpm install
pnpm test
pnpm build
```

Git からインストールした場合は `prepare` スクリプトで `dist` がビルドされます。

## リリース

リリース番号の更新、コミット、タグ作成は `release-it` で行います。

```sh
pnpm release
```

タグの push を契機に GitHub Actions がテスト・ビルドを実行し、`dist` を含めたリリースタグと GitHub Release を作成します。

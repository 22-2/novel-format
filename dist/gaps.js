/**
 * 地の文を挟まずに連続させないカッコ。
 * 心中（`（）`）は視点人物の思考なので話者が分かる。これに接するセリフ（`「」`）か心中が対象。
 * `『』` は表示文言や人ならざる声で、視点人物の発言ではないため対象にしない。
 */
const COVERED_BRACKETS = new Set(["speech", "thought"]);
/**
 * 同じ人物のセリフと心中が、地の文を挟まずに連続している位置に目印のコメントを挟む。
 * marker が空文字なら何もしない。
 *
 * セリフの話者はテキストから判別できないため、心中に接するセリフは話者が違う場合もある。
 * 書き手が確かめる目印として入れ、自動で書き換えはしない。
 */
export function insertNarrationGapMarkers(lines, marker) {
    if (marker === "")
        return [...lines];
    const result = [];
    // 目印の判定に使う直前の行。コメント行は含めない
    let previous;
    for (const line of lines) {
        if (line.kind === "comment") {
            // すでにコメントが挟まっている位置には入れない。
            // 理由: 目印自体がコメントなので、整形を繰り返しても目印が増えないようにするため。
            result.push(line);
            previous = undefined;
            continue;
        }
        if (previous !== undefined && needsNarrationGap(previous, line)) {
            result.push({ kind: "comment", text: marker, blankLinesBefore: 0 });
        }
        result.push(line);
        previous = line;
    }
    return result;
}
function needsNarrationGap(previous, current) {
    const brackets = [previous.bracket, current.bracket];
    if (!brackets.every((bracket) => bracket !== undefined && COVERED_BRACKETS.has(bracket)))
        return false;
    // 「」同士は話者が替わっていれば正しい並びなので、心中が絡む組み合わせだけを対象にする
    return brackets.includes("thought");
}

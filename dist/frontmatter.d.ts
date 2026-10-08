/** 先頭のYAMLフロントマターと本文を分ける。フロントマターがなければ frontmatter は null */
export declare function splitFrontmatter(text: string): {
    frontmatter: string | null;
    body: string;
};
/** フロントマターと本文を、間に空行1つを挟んで結合する */
export declare function joinFrontmatter(frontmatter: string, body: string): string;

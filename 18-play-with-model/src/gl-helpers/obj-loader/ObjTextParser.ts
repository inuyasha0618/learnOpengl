// TODO: 将下面方法中不暴露给外界的置成private
class ObjTextParser {
    str: string;
    currentIndex: number = 0;

    public init(str: string): void {
        this.str = str;
        this.currentIndex = 0;
    }

    public getWord(): string {
        this.skipDelimiters();
        const wordLen: number = this.getWordLength(this.currentIndex);
        // TODO: 注意原版wordLen是0时返回的是null，我这里返回的是空字符串
        const word: string = this.str.substr(this.currentIndex, wordLen);
        // 懂了，每次都会跳过空格，所以不用加1了
        // getWord的同时，当前指针已移动到该word后面了
        this.currentIndex += wordLen;

        return word;
    }

    public getInt(): number {
        const word: string = this.getWord();
        return parseInt(word, 10);
    }

    public getFloat(): number {
        const word: string = this.getWord();
        return parseFloat(word);
    }

    // Parses next 'word' into a series of integers.
    // Assumes the integers are separated by a slash (/).
    public parseIndexes(indexes: Array<number>): boolean {
        const word: string = this.getWord();
        indexes[0] = -1;
        indexes[1] = -1;
        indexes[2] = -1;

        if (word) {
            const tempArr = word.split('/');
            for (let i = 0, len = tempArr.length; i < len; i++) {
                const currIndex: number = parseInt(tempArr[i], 10);
                indexes[i] = isNaN(currIndex) ? -1 : currIndex;
            }
            return true;
        }
        return false;
    }

    public getRestOfLine(): string {
        return this.str.substr(this.currentIndex);
    }

    private isDelimiter(char: string): boolean {
        return (
            char === ' ' ||
            char === '\t' ||
            char === '(' ||
            char === ')' ||
            char === '"' ||
            char === "'"
        );
    }

    // 将currentIndex移动到下一个不是delimeter的位置
    private skipDelimiters(): void {
        while (this.currentIndex < this.str.length && this.isDelimiter(this.str.charAt(this.currentIndex))) {
            this.currentIndex += 1;
        }
    }

    private getWordLength(start: number): number {
        let i: number = start;
        while (i < this.str.length && !this.isDelimiter(this.str.charAt(i))) {
            i += 1;
        }
        return i - start;
    }

    private skipToNextWord(): void {
        this.skipDelimiters();
        // TODO: 这样做是假设了单词之间只有一个空格
        this.currentIndex += (this.getWordLength(this.currentIndex) + 1);
        // TODO: 回过头来对比一下，我认为我的写法是更加正确的
        // this.currentIndex += this.getWordLength(this.currentIndex);
        // this.skipDelimiters();
    }
}

export default ObjTextParser;
export function splitLastWord(str: string) {
    if (!str) return ["", ""];

    const words = str.trim().split(" ");
    if (words.length === 1) return ["", words[0]]; // jodi sudhu ekta word thake

    const lastWord = words.pop(); // last word alada
    const rest = words.join(" "); // baki words abar string hisebe
    return [rest, lastWord];
}
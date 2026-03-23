export interface GeneratedQuestion {
    text: string;
    type: string;
    options: {
        text: string;
        isCorrect: boolean;
    }[];
}

/**
 * A local, rule-based quiz generator that doesn't depend on external APIs.
 * It uses simple NLP techniques: sentence importance scoring and keyword extraction.
 */
export async function generateLocalQuizQuestions(context: string, count: number = 5): Promise<GeneratedQuestion[]> {
    if (!context || context.trim().length < 20) {
        return [];
    }

    // 1. Clean and split text into sentences
    // More robust splitting that handles various line endings and lack of formal punctuation
    const sentences = context
        .split(/[.!?\n\r]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 500);

    if (sentences.length === 0) {
        // Fallback: split by commas or just chunks if no punctuation at all
        const chunks = context.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 15);
        if (chunks.length > 0) sentences.push(...chunks);
        else if (context.length > 20) sentences.push(context.slice(0, 200));
    }

    // 2. Score sentences for "teachability"
    const scoredSentences = sentences.map(sentence => {
        let score = 0;
        const low = sentence.toLowerCase();

        if (low.includes(' is ') || low.includes(' are ') || low.includes(' refers to ') || low.includes(' means ')) score += 10;
        if (low.includes(' important ') || low.includes(' key ') || low.includes(' primary ') || low.includes(' must ')) score += 5;
        if (low.includes(' because ') || low.includes(' due to ') || low.includes(' since ')) score += 3;
        
        if (sentence.split(' ').length < 5) score -= 5;
        if (sentence.length > 300) score -= 2;

        return { sentence, score };
    });

    const bestSentences = scoredSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(count, 10)); // Extract more candidates

    const quiz: GeneratedQuestion[] = [];
    const usedSentences = new Set<string>();

    for (const { sentence } of bestSentences) {
        if (quiz.length >= count) break;
        if (usedSentences.has(sentence)) continue;

        const question = createQuestionFromSentence(sentence, sentences);
        if (question) {
            quiz.push(question);
            usedSentences.add(sentence);
        }
    }

    return quiz;
}

function createQuestionFromSentence(sentence: string, allSentences: string[]): GeneratedQuestion | null {
    const low = sentence.toLowerCase();
    
    // Pattern 1: Definitions (X is Y)
    // Extract X and make it the blank
    const isMatch = sentence.match(/(.*) (is|are|refers to|means) (.*)/i);
    if (isMatch) {
        const subject = isMatch[1].trim();
        const definition = isMatch[3].trim();
        
        // Ensure subject is a short noun phrase (simplified)
        if (subject.split(' ').length > 4) return createClozeQuestion(sentence, allSentences);

        return {
            text: `What ${isMatch[2].toLowerCase()} defined as: "${definition}"?`,
            type: 'MULTIPLE_CHOICE',
            options: shuffle([
                { text: subject, isCorrect: true },
                ...getRandomDistractors(subject, allSentences, 3)
            ])
        };
    }

    // Default: Cloze (Fill in the blank) style for a key term
    return createClozeQuestion(sentence, allSentences);
}

function createClozeQuestion(sentence: string, allSentences: string[]): GeneratedQuestion | null {
    const words = sentence.split(' ').filter(w => w.length > 5);
    if (words.length === 0) return null;

    // Pick a long noun/keyword to hide
    const keyword = words[Math.floor(Math.random() * words.length)].replace(/[,.;]$/, '');
    const blanked = sentence.replace(new RegExp(`\\b${keyword}\\b`, 'i'), '__________');

    return {
        text: `Complete the following statement: "${blanked}"`,
        type: 'MULTIPLE_CHOICE',
        options: shuffle([
            { text: keyword, isCorrect: true },
            ...getRandomDistractors(keyword, allSentences, 3)
        ])
    };
}

function getRandomDistractors(correct: string, pool: string[], count: number): { text: string; isCorrect: boolean }[] {
    const distractors: string[] = [];
    const allWords = pool.join(' ').split(/[ ,.]+/).filter(w => w.length > 4 && w.toLowerCase() !== correct.toLowerCase());
    
    // Pick random unique words from the pool as distractors
    const uniqueWords = Array.from(new Set(allWords));
    while (distractors.length < count && uniqueWords.length > 0) {
        const idx = Math.floor(Math.random() * uniqueWords.length);
        distractors.push(uniqueWords.splice(idx, 1)[0]);
    }

    // Fallback if not enough words
    const backups = ['None of the above', 'Both A and B', 'A specific context', 'An external factor'];
    while (distractors.length < count) {
        distractors.push(backups[distractors.length % backups.length]);
    }

    return distractors.map(d => ({ text: d, isCorrect: false }));
}

function shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

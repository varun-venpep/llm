const { generateLocalQuizQuestions } = require('./src/lib/quiz-generator');

const sampleContext = `
Title: AI as code Architect
Description: Google Antigravity is an AI-powered integrated development environment developed by Google.

Module: Key Aspects of AI in Software Architecture
Lesson: Learning the basics
Content: AI in architecture is the use of artificial intelligence to automate complex design decisions. It refers to the integration of machine learning models into the software development lifecycle.
Lesson: Efficient learning
Content: Prompt engineering is the primary way developer interact with LLMs. It means crafting specific instructions to get high-quality outputs.
`;

async function test() {
    console.log("Testing Semantic Quiz Generator...");
    try {
        const questions = await generateLocalQuizQuestions(sampleContext, 3);
        console.log("Generated Questions:", JSON.stringify(questions, null, 2));
        
        if (questions.length > 0) {
            console.log("\nSUCCESS: Generated " + questions.length + " questions.");
        } else {
            console.log("\nFAILURE: No questions generated.");
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

test();

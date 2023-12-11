import "dotenv/config";

import { ChatOpenAI } from "langchain/chat_models/openai";

import { PromptTemplate } from "langchain/prompts";

import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";

import { formatDocumentsAsString } from "langchain/util/document";

import { vectorize } from "./vectorizer.js";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  maxRetries: 0,
});

const formatChatHistory = (previousChatHistory: [] | [string, string][]) => {
  if (!previousChatHistory.length) {
    return ``;
  } else {
    return previousChatHistory
      .map(([human, ai]) => {
        return `Human: ${human}\nAI: ${ai}`;
      })
      .join("\n\n");
  }
};

function extractLinks(inputString) {
  const linkRegex = /(?:\[([^\]]+)\]\(([^)]+)\))|(?:(https?:\/\/[^\s]+))/g;
  const links = [];

  let match;
  while ((match = linkRegex.exec(inputString)) !== null) {
    if (match[1] && match[2]) {
      // Case: [text](url)
      const linkText = match[1];
      const linkUrl = match[2];
      links.push({ text: linkText, url: linkUrl });
    } else if (match[3]) {
      // Case: raw URL without code formatting
      const linkUrl = match[3];
      links.push({ text: linkUrl, url: linkUrl });
    }
  }

  return links;
}

async function validateHyperlinks(input: string): Promise<string> {
  const hyperlinks: { text: string; url: string }[] = extractLinks(input);

  console.log("[DEBUG]: hyperlinks", hyperlinks);

  const validationResult: string[] = [];

  await Promise.all(
    hyperlinks.map(async (hyperlink) => {
      try {
        const response = await fetch(hyperlink.url);
        if (response.ok) validationResult.push(hyperlink.url);
      } catch (error) {
        // invalid - ignore.
      }
    })
  );
  console.log("[DEBUG]: validation result", validationResult);
  return JSON.stringify(validationResult);
}

/**
 * Create a prompt template for generating an answer based on context and
 * a question.
 *
 * Chat history will be an empty string if it's the first question.
 *
 * inputVariables: ["chatHistory", "context", "question"]
 */
const QUESTION_PROMPT = PromptTemplate.fromTemplate(
  `Answer the question using the provided context.
  The context may have relative markdown urls, which should be converted to absolute urls based on the context source.
  For example "../../../payment-methods/payflow-pro.md" should become "https://developer.adobe.com/commerce/webapi/graphql/payment-methods/payflow-pro/".
  Or "../../examples/events/example-contexts/mock-shopping-cart-context.md" should become "https://github.com/adobe/commerce-events/tree/main/examples/events/example-contexts/mock-shopping-cart-context.md".
  If you don't know the answer, just say that you don't know.
  Always use Markdown format in your response.
  Keep the answer concise.
  Do not use the term "Magento", instead use "Adobe Commerce".
    ----------------
    CONTEXT: {context}
    ----------------
    CHAT HISTORY: {chatHistory}
    ----------------
    QUESTION: {question}
    ----------------
    Helpful Answer:`
);

const CONTEXT_LINK_VALIDATION_PROMPT = PromptTemplate.fromTemplate(
  `You are an assistant tasked with refining a given input to retain only the valid hyperlinks. You have a context, represented as an array of hyperlink strings that are known to be valid and real. If a hyperlink is not present in the array, it is considered invalid and should be removed from both the input and the answer. If a hyperlink is part of the array, it should be retained in both the input and the answer. If the array is empty, then all hyperlinks in the input are invalid and should be removed.

  Your goal is to produce a revised answer that is coherent, grammatically correct, and contextually meaningful, while retaining as much original formatting as possible. And again - DO NOT return invalid hyperlinks.
  ----------------
  INPUT: {input}
  ----------------
  CONTEXT: {hyperlinks}
  ----------------
  Answer:`
);

// TODO allow single dataset to generate multiple embeddings based on different file extensions.
// const vectorStore = await vectorize("commerce-events_developer");
// const vectorStore = await vectorize("commerce-events_user");
const vectorStore = await vectorize("commerce-webapi");

const retriever = vectorStore.asRetriever({
  // TODO: try mmr, but needs diff vector store.
  // searchType: "mmr",
  // searchKwargs: { fetchK: 5 }
});

const chain = RunnableSequence.from([
  {
    question: (input: { question: string; chatHistory?: string }) =>
      input.question,
    chatHistory: (input: { question: string; chatHistory?: string }) => {
      let history = input.chatHistory ?? "";
      // console.log('[DEBUG]: chatHistory', history);
      return history;
    },
    context: async (input: { question: string; chatHistory?: string }) => {
      const relevantDocs = await retriever.getRelevantDocuments(input.question);
      // console.log('[DEBUG]: found', relevantDocs.length,  'relevant docs');
      // TODO: Ensure any linked docs are also added to context, up to a limit.
      // For example if a document's content references another document, include that other document in the context.
      const serialized = formatDocumentsAsString(relevantDocs);
      return serialized;
    },
  },
  QUESTION_PROMPT,
  (prevOutput) => {
    console.log("[DEBUG]: Injected QUESTION_PROMPT:", prevOutput.value);
    return prevOutput;
  },
  model,
  new StringOutputParser(),
  {
    input: (prevOutput) => prevOutput,
    hyperlinks: async (prevOutput) => await validateHyperlinks(prevOutput),
  },
  CONTEXT_LINK_VALIDATION_PROMPT,
  (prevOutput) => {
    console.log(
      "[DEBUG]: Injected CONTEXT_LINK_VALIDATION_PROMPT:",
      prevOutput.value
    );
    return prevOutput;
  },
  model,
  new StringOutputParser(),
]);

// TODO: Chain doesn't chain
// const linkValidationChain = RunnableSequence.from([
//   {
//     input: (prevOutput) => prevOutput,
//     hyperlinks: async (prevOutput) => await validateHyperlinks(prevOutput),
//   },
//   CONTEXT_LINK_VALIDATION_PROMPT,
//   (prevOutput) => {
//     console.log(
//       "[DEBUG]: Injected CONTEXT_LINK_VALIDATION_PROMPT:",
//       prevOutput.value
//     );
//     return prevOutput;
//   },
//   model,
//   new StringOutputParser(),
// ]);

const chatHistory: [string, string][] = [];

export async function query(input) {
  console.log("[DEBUG]: QUERY", input);
  let result = await chain.invoke({
    question: input,
    chatHistory: formatChatHistory(chatHistory),
  });
  console.log("[DEBUG]: RESULT1", result);

  // result = await linkValidationChain.invoke(result);
  // console.log("[DEBUG]: RESULT2", result);
  chatHistory.push([input, result]);

  return result;
}

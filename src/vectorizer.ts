import * as fs from "fs/promises";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "langchain/vectorstores/faiss";
import { getFilePaths } from "./scrapers/fileScraper.js";

const embeddings = new OpenAIEmbeddings();

interface Page {
  pageContent: string;
  metadata: {
    source: string;
  };
}

async function getPageData(filePath: string): Promise<Page> {
  const fileContent = await fs.readFile(filePath, "utf-8");
  // Trim "datasets/" from the beginning of metadata.source
  const trimmedSource = filePath.replace(/^datasets\//, "");

  return {
    pageContent: fileContent,
    metadata: {
      source: trimmedSource,
    },
  };
}

async function processFiles(filePaths: string[]): Promise<Page[]> {
  const pageDataPromises = filePaths.map((filePath) => getPageData(filePath));
  const pageDataArray = await Promise.all(pageDataPromises);
  return pageDataArray;
}

function filterByExtensions(paths, extensions) {
  return paths.filter((path) => {
    for (const extension of extensions) {
      if (path.endsWith(extension)) {
        return true;
      }
    }
    return false;
  });
}

const ALLOWED_EXTENSIONS = [
  ".md",
  ".mdx",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".html",
  ".css",
  ".json",
];

const mdSplitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 1000,
  chunkOverlap: 20,
});

const htmlSplitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
  chunkSize: 1000,
  chunkOverlap: 20,
});

const jsSplitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
  chunkSize: 1000,
  chunkOverlap: 20,
});

const genericSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 20,
});

// vectorizes a dataset directory, only generating embeddings for the allowed file extensions
export async function vectorize(
  REPO_NAME: string,
  allowedExtensions: string[] = ALLOWED_EXTENSIONS
) {
  const STORE_PATH = `./embeddings/${REPO_NAME}`;

  let vectorStore: FaissStore;
  try {
    vectorStore = await FaissStore.load(STORE_PATH, embeddings);
    console.log("[DEBUG]: loaded pre-generated store");
  } catch (e) {
    const contentDocs = await getFilePaths(`./datasets/${REPO_NAME}`)
      .then((filePaths) => filterByExtensions(filePaths, allowedExtensions))
      .then((filePaths) => processFiles(filePaths))
      .then((pageDataArray) =>
        pageDataArray.map((pageData) => new Document(pageData))
      );
    console.log("Generating file paths for extensions", allowedExtensions);
    const mdDocs = [];
    const jsDocs = [];
    const htmlDocs = [];
    const otherDocs = [];
    for (const contentDoc of contentDocs) {
      if (
        contentDoc.metadata.source.endsWith(".test.tsx") ||
        contentDoc.metadata.source.endsWith(".test.ts") ||
        contentDoc.metadata.source.endsWith(".snap") ||
        contentDoc.metadata.source.endsWith(".test.js")
      ) {
        // !ignore
      } else if (
        contentDoc.metadata.source.endsWith(".md") ||
        contentDoc.metadata.source.endsWith(".mdx")
      ) {
        mdDocs.push(contentDoc);
      } else if (contentDoc.metadata.source.endsWith(".html")) {
        htmlDocs.push(contentDoc);
      } else if (
        contentDoc.metadata.source.endsWith(".js") ||
        contentDoc.metadata.source.endsWith(".jsx") ||
        contentDoc.metadata.source.endsWith(".ts") ||
        contentDoc.metadata.source.endsWith(".tsx")
      ) {
        jsDocs.push(contentDoc);
      } else {
        otherDocs.push(contentDoc);
      }
    }

    const documents = [];
    await mdSplitter.splitDocuments(mdDocs).then((docs) => {
      docs.forEach((doc) => documents.push(doc));
    });
    await jsSplitter.splitDocuments(jsDocs).then((docs) => {
      docs.forEach((doc) => documents.push(doc));
    });
    await htmlSplitter.splitDocuments(htmlDocs).then((docs) => {
      docs.forEach((doc) => documents.push(doc));
    });
    await genericSplitter.splitDocuments(otherDocs).then((docs) => {
      docs.forEach((doc) => documents.push(doc));
    });
    console.log("[debug]: created", documents.length, "documents");
    console.log(
      "Creating new vector store, this can take some time and will cost $$. Exit now if you got here by mistake."
    );
    vectorStore = await FaissStore.fromDocuments(documents, embeddings);
    await vectorStore.save(STORE_PATH);
    console.log("[debug]: embeddings created.");
  }
  return vectorStore;
}

# Retrieval Augmented Generation (RAG) Bot

<img src="https://github.com/sirugh/gw23-rag-chat-bot/assets/1278869/e5b89e1c-2e3a-4af4-9f76-75b3802784c0" width="400" />
<img src="https://github.com/sirugh/gw23-rag-chat-bot/assets/1278869/713d61ba-19f4-4480-b01c-2ac798aa7122" width="400" />
<img src="https://github.com/sirugh/gw23-rag-chat-bot/assets/1278869/16369d73-f29f-422f-a270-c33ca06450d3" width="400" />
<img src="https://github.com/sirugh/gw23-rag-chat-bot/assets/1278869/6d59f73a-a74d-4cea-a6ff-2c46dd34b191" width="400" />


This GarageWeek project aims to provide a interface which allows human-like interaction with a search agent. A poor man's [mendable.ai](https://www.mendable.ai/) or [phind.com](https://phind.com), if you will.

Technically this project uses a [RAG pattern](https://eugeneyan.com/writing/llm-patterns/#retrieval-augmented-generation-to-add-knowledge). The general process for the pattern is:

1. Dataset, such as a collection of files, a code repo, etc, is turned into a vector store of chunked documents of various size.
2. When a user makes a query, the vector store is searched, probably with semantic search, for the most relevant documents or chunks.
3. These chunks are appended to an actual query, and the resulting text is fed into a language model.
4. The language model generates a response, which is then returned to the user.

The point of RAG is to augment an LLM's training set with data that the LLM doesn't know about.

![rag-diagram](https://docs.aws.amazon.com/images/sagemaker/latest/dg/images/jumpstart/jumpstart-fm-rag.jpg)

## Lessons Learned

### Dataset/Embeddings

When given a repo which includes user documentation AND internal implementation code, the LLM would get confused as it does not "know" the difference between internal and external code. Attempting to solve this, I have generated embeddings for developers, using all files within the repo, and then embeddings just for users, using just `*.md` files. So if you wanted to create a bot for users of the events SDK, you would use the user embeddings. If you wanted to create a bot for the developers, you would use the developer embeddings.

The two main takeaways for this were:
- There's many many more robust ways of generating the vector stores than what I did.
- The Retrieval is _so_ important to the accuracy/relevance of bot responses. Since the LLM will only generate answers based on provided context, you _must_ provide as relevant context as possible in your query to the LLM. There are multiple search types, such as semantic, MMR, etc.


### Cost

Rule 1 when working with a potentially costly API - **Do not use a watcher**

Rule 2, if you must use a watcher, **Do not use a watcher**

Rule 3, make sure the dataset is small or minimized. For example, whitelist files that you want to generate embeddings for. Definitely don't try to generate embeddings over a `.git` directory...

I'd probably try to bake in a query cost limiter from the get-go, I think it would be doable, and could prevent you from kicking off any crazy requests and not realizing it.

![openai's middle finger](https://github.com/sirugh/gw23-chat-bot/assets/1278869/be530d3f-2c21-45b3-88c6-084d2a01e42e)

### Links

Handling links is hard. Validation is hard. One solution I tried was to essentially create a second API call. So first I ask the LLM for an answer, and then I pull all links out of that answer, validate those links, and then pass an array of valid links to a second LLM, with a prompt asking to only retain those valid links from the array.

`originalQuery -> output with links -> \[links\] -> linkValidationQuery -> output with only valid links`

This didn't seem to work well for some reason. I would have assumed the LLM could easily perform a basic task like string manipulation given, but I misunderstand how it really works.

### Formatting UI

The prompts tend to get back markdown formatted responses. This may be due to the references provided, which are generally markdown files. Perhaps you can circumvent this with some prompt engineering.

Anyways, formatting these was basically 2 steps:

1. Run the response string through some regex and return things like code blocks ie `<code>` and `<pre>`. Escape `<` and `&`, and (see in public/index.html)
2. Add PrismJS and call it, which adds some HTML and styles via classes.

<!--
## Brainstorming Ideas (pre-hackathon)

- Generate a video summary and interactible GPT based on transcript text.
  -- include timestamps and links in response
  -- eg. https://experienceleague.adobe.com/docs/commerce-learn/tutorials/adobe-developer-app-builder/api-mesh/getting-started-api-mesh.html?lang=en

- Provide repo summary and interactible GPT based on repo link
  -- eg. https://github.com/AdobeDocs/commerce-webapi/blob/main/src/

- Provide a docs summary and interactibel GPT based on markdown files.
  -- eg. https://experienceleague.adobe.com/docs/commerce-learn/

- Generally, provide interactible GPT based on URL, scraping deeply within site.
-->
## References/etc

- https://github.com/pchunduri6/rag-demystified
- https://smith.langchain.com/hub/rlm/rag-prompt

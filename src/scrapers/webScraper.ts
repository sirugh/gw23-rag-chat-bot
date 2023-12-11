import "dotenv/config";

// TODO: resolve token auth, as we get rate limited quickly using public API
async function getUrls(repo: string): Promise<string[]> {
  const apiUrl = `https://api.github.com/repos/${repo}/git/trees/main?recursive=1`;
  console.log("fetching", apiUrl);
  // TODO: Not working.
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${process.env["GITHUB_TOKEN"]}`,
    },
  });
  const data = await response.json();
  console.log(data);
  const urls: string[] = [];

  // Recursive function to process the tree
  async function processTree(tree: any[]) {
    for (const item of tree) {
      const itemResponse = await fetch(item.url);
      const itemData = await itemResponse.json();

      urls.push(item.url); // Add the current URL to the result array

      if (itemData.type === "tree") {
        // If the type is 'tree', make a recursive call to process the tree
        await processTree(itemData.tree);
      }
    }
  }

  // Start processing the initial tree
  await processTree(data.tree);

  return urls;
}

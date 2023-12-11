import * as fs from 'fs/promises';
import * as path from 'path';

export async function getFilePaths(directoryPath: string): Promise<string[]> {
  const filePaths: string[] = [];

  async function processDirectory(currentPath: string) {
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        // If it's a directory, recursively process it
        await processDirectory(itemPath);
      } else {
        // If it's a file, add its path to the result array
        filePaths.push(itemPath);
      }
    }
  }

  // Start processing the initial directory
  await processDirectory(directoryPath);

  return filePaths;
}

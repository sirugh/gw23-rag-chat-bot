import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { query } from "./query.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/query", async (req, res) => {
  const input = req.query.question || "";
  const result = await query(input);
  res.json({ response: result });
});

app.get("/prism.js", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/prism.js"));
});

app.get("/prism.css", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/prism.css"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

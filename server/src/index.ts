import "dotenv/config";
import express from "express";
import cors from "cors";

import { identifyRouter } from "./routes/identify";
import { ocrReceiptRouter } from "./routes/ocrReceipt";
import { lookupPriceRouter } from "./routes/lookupPrice";

const app = express();

app.use(cors());
// Two photos at ~1MB base64 each plus JSON overhead comfortably fits under 15mb.
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "zora-ai-proxy" });
});

app.use("/identify", identifyRouter);
app.use("/ocr-receipt", ocrReceiptRouter);
app.use("/lookup-price", lookupPriceRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Zura AI proxy listening on http://0.0.0.0:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("WARNING: ANTHROPIC_API_KEY is not set. /identify will fail until it's configured in .env.");
  }
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
    console.warn("WARNING: GOOGLE_API_KEY/GOOGLE_SEARCH_ENGINE_ID not set. /lookup-price will fail until configured in .env.");
  }
});

import http from "node:http";
import { exec } from "node:child_process";

const port = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  if (req.method === "GET" || req.url === "/health" || req.url === "/ready") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ready" }));
    return;
  }

  // Read request body to parse payload
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    let action = "migrate";
    try {
      if (body) {
        const payload = JSON.parse(body);
        if (payload.action === "seed") {
          action = "seed";
        }
      }
    } catch {
      // ignore
    }

    const command = action === "seed" ? "npx tsx prisma/seed.ts" : "npx prisma migrate deploy";

    console.log(`Starting execution: ${command}`);
    exec(command, { env: process.env }, (error, stdout, stderr) => {
      console.log(`Execution stdout:\n${stdout}`);
      console.error(`Execution stderr:\n${stderr}`);

      if (error) {
        console.error(`Execution error: ${error.message}`);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            error: error.message,
            stdout,
            stderr,
          }),
        );
      } else {
        console.log(`Execution completed successfully.`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            stdout,
            stderr,
          }),
        );
      }
    });
  });
});

server.listen(port, () => {
  console.log(`Migration helper listening on port ${port}`);
});

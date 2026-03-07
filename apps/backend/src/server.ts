import { createApp } from "./app/createApp";
import { defaultBackendLogFilePath } from "./app/createLogger";

const app = createApp();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

async function startServer() {
  try {
    await app.listen({ host, port });
    app.log.info(
      {
        host,
        logFilePath: defaultBackendLogFilePath,
        port,
      },
      "Backend が起動しました。",
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void startServer();

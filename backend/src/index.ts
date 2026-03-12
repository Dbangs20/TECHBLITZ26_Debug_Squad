import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectToDatabase } from "./db/connect.js";

async function bootstrap() {
  await connectToDatabase();
  app.listen(env.PORT, () => {
    console.log(`ClinicFlow backend running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start ClinicFlow backend", error);
  process.exit(1);
});

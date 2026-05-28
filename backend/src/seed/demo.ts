import { connectDatabase, disconnectDatabase } from "@/config/database.js";
import { ensureDemoUser } from "@/services/auth.service.js";

async function seed() {
  await connectDatabase();
  const user = await ensureDemoUser();
  process.stdout.write(`Demo teacher ready: ${user.email}\n`);
  await disconnectDatabase();
}

void seed().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});


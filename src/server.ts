import logger from "./logger";
import { BrokerAsPromised } from "rascal";
import rabbitConfig from "./rabbitConfig";
import router from "./routes";
import express from "express";
import { db } from "./db";
import { addFlightPlanListener } from "./process";

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down...");
  process.exit(0);
});

const app = express();

app.use(express.json());
app.use(router);

async function main() {
  logger.info("Starting Flight Plan Manager");

  await db.migrate.latest();

  // Create Rascal broker
  const broker = await BrokerAsPromised.create(rabbitConfig);

  const subscriber = await broker.subscribe("flight-plan-manager-queue");

  addFlightPlanListener(subscriber);

  broker.on("error", (err) => {
    logger.error(`Broker error: ${err}`);
  });

  app.listen(3000, () => {
    logger.info("Flight Plan Manager is running on port 3000");
  });
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});

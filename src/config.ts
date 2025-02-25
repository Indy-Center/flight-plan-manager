import "dotenv/config";

export const config = {
  RABBIT_URL: process.env.RABBIT_URL!,
  LOG_LEVEL: process.env.LOG_LEVEL!,
  DATABASE_URL: process.env.DATABASE_URL!,
};

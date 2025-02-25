import { Router } from "express";
import { db } from "./db";

const router = Router();

router.get("/v1/flight-plans", async (req, res) => {
  const result = await db.select("*").from("flight_plans");
  res.json(result);
});

router.get("/v1/flight-plans/:id", async (req, res) => {
  // First, get the flight plan
  const results = await db
    .select("*")
    .from("flight_plans")
    .where("id", req.params.id)
    .first();

  const revisions = await db
    .select("*")
    .from("flight_plan_revisions")
    .where("flight_plan_id", req.params.id)
    .orderBy("revision", "desc");

  if (!results) {
    res.status(404).json({ error: "Flight plan not found" });
    return;
  }

  const flightPlan = {
    ...results,
    flight_plan: revisions[0].flight_plan,
    revisions,
  };

  res.json(flightPlan);
});

export default router;

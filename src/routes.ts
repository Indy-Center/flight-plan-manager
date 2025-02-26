import { Router } from "express";
import { db } from "./db";

const router = Router();

router.get("/v1/flight-plans", async (req, res) => {
  const { page = 1, limit = 10, cid, callsign, status } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const query = db
    .select("*")
    .from("flight_plans")
    .orderBy("created_at", "desc");

  if (cid) {
    query.where("cid", cid);
  }

  if (callsign) {
    query.where("callsign", callsign);
  }

  if (status) {
    query.where("status", status);
  }

  const result = await query.limit(Number(limit)).offset(offset);

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

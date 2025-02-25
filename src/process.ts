import { SubscriberSessionAsPromised } from "rascal";
import { db } from "./db";
import logger from "./logger";
import type { FlightPlan, FlightPlanRevision } from "./db";

export async function addFlightPlanListener(
  subscriber: SubscriberSessionAsPromised
) {
  subscriber.on("message", async (_: any, content: any, ackOrNack: any) => {
    await processFlightPlanEvent(content);
    await ackOrNack();
  });
}

export async function processFlightPlanEvent(event: FlightPlanEvent) {
  if (event.event === "file") {
    await processFlightPlanFile(event);
  } else if (event.event === "update") {
    await processFlightPlanUpdate(event);
  } else if (event.event === "expire") {
    await processFlightPlanExpire(event);
  }
}

async function processFlightPlanFile(event: FlightPlanEvent) {
  logger.info(
    `Processing flight plan file: ${event.pilot.cid}-${event.pilot.callsign}-${event.flight_plan.departure}-${event.flight_plan.revision_id}`
  );

  // First expire any active flight plans for this pilot/callsign/departure combination
  await expireExistingFlightPlans(
    event.pilot.cid,
    event.pilot.callsign,
    event.flight_plan.departure
  );

  // Insert a new flight plan record
  const flightPlan = await createFlightPlan({
    cid: event.pilot.cid,
    callsign: event.pilot.callsign,
    departure: event.flight_plan.departure,
    filed_at: new Date(event.timestamp).toISOString(),
    status: "active",
  });

  // Insert the flight plan revision
  await createFlightPlanRevision({
    flight_plan_id: flightPlan.id,
    flight_plan: event.flight_plan,
    revision: event.flight_plan.revision_id || 0,
  });
}

async function processFlightPlanUpdate(event: FlightPlanEvent) {
  logger.info(
    `Processing flight plan update: ${event.pilot.cid}-${event.pilot.callsign}-${event.flight_plan.departure}-${event.flight_plan.revision_id}`
  );

  const flightPlan =
    (await retrieveActiveFlightPlan(
      event.pilot.cid,
      event.pilot.callsign,
      event.flight_plan.departure
    )) ||
    (await createFlightPlan({
      cid: event.pilot.cid,
      callsign: event.pilot.callsign,
      departure: event.flight_plan.departure,
      filed_at: new Date(event.timestamp).toISOString(),
      status: "active",
    }));

  // Insert the flight plan revision
  await createFlightPlanRevision({
    flight_plan_id: flightPlan.id,
    flight_plan: event.flight_plan,
    revision: event.flight_plan.revision_id || 0,
  });
}

async function processFlightPlanExpire(event: FlightPlanEvent) {
  logger.info(
    `Processing flight plan expire: ${event.pilot.cid}-${event.pilot.callsign}-${event.flight_plan.departure}-${event.flight_plan.revision_id}`
  );

  const flightPlan = await retrieveActiveFlightPlan(
    event.pilot.cid,
    event.pilot.callsign,
    event.flight_plan.departure
  );

  if (!flightPlan) {
    logger.info(
      `Received flight plan expire for ${event.pilot.cid}-${event.pilot.callsign}-${event.flight_plan.departure} but no active flight plan found.`
    );
    return;
  }

  await updateFlightPlan({
    id: flightPlan.id,
    expired_at: new Date().toISOString(),
    status: "expired",
  });
}

async function createFlightPlan(flightPlan: Partial<FlightPlan>) {
  const [result] = await db
    .insert({
      cid: flightPlan.cid,
      callsign: flightPlan.callsign,
      departure: flightPlan.departure,
      filed_at: flightPlan.filed_at,
      status: "active",
    })
    .into("flight_plans")
    .returning("*");

  return result;
}

async function retrieveActiveFlightPlan(
  cid: number,
  callsign: string,
  departure: string
) {
  const result = await db
    .select("*")
    .from("flight_plans")
    .where("cid", cid)
    .andWhere("callsign", callsign)
    .andWhere("departure", departure)
    .andWhere("status", "active")
    .orderBy("filed_at", "desc")
    .first();

  return result;
}

async function updateFlightPlan(flightPlan: Partial<FlightPlan>) {
  const [result] = await db
    .update(flightPlan)
    .from("flight_plans")
    .where("id", flightPlan.id)
    .returning("*");

  return result;
}

async function createFlightPlanRevision(
  flightPlanRevision: Partial<FlightPlanRevision>
) {
  const [result] = await db
    .insert(flightPlanRevision)
    .into("flight_plan_revisions")
    .onConflict(["flight_plan_id", "revision"])
    .merge()
    .returning("*");

  return result;
}

async function expireExistingFlightPlans(
  cid: number,
  callsign: string,
  departure: string
) {
  await db
    .update({
      expired_at: new Date().toISOString(),
      status: "expired",
    })
    .from("flight_plans")
    .where("cid", cid)
    .andWhere("callsign", callsign)
    .andWhere("departure", departure)
    .andWhere("status", "active");
}

type FlightPlanEvent = {
  event: "file" | "update" | "expire";
  pilot: {
    cid: number;
    callsign: string;
  };
  flight_plan: {
    flight_rules: string;
    aircraft: string;
    aircraft_faa: string;
    aircraft_short: string;
    departure: string;
    arrival: string;
    alternate: string;
    cruise_tas: string;
    altitude: string;
    deptime: string;
    enroute_time: string;
    fuel_time: string;
    remarks: string;
    route: string;
    revision_id: number;
    assigned_transponder: string;
  };
  timestamp: number;
};

import knex from "knex";
import { config } from "./config";

export const db = knex({
  client: "pg",
  connection: config.DATABASE_URL,
});

// Define interfaces outside the module declaration
interface FlightPlan {
  id: string;
  cid: number;
  callsign: string;
  departure: string;
  filed_at: string;
  status: "active" | "expired";
  created_at: string;
  expired_at: string;
}

interface FlightPlanRevision {
  id: string;
  flight_plan_id: string;
  revision: number;
  created_at: string;
  flight_plan: FlightPlanDetails;
}

interface FlightPlanDetails {
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
}

declare module "knex/types/tables" {
  interface Tables {
    flight_plans: FlightPlan;
    flight_plan_revisions: FlightPlanRevision;
  }
}

// Export the interfaces
export type { FlightPlan, FlightPlanRevision, FlightPlanDetails };

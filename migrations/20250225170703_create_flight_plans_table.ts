import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // The flight_plans table is used to store root flight plan information.
  await knex.schema.createTable("flight_plans", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.integer("cid").notNullable();
    table.string("callsign").notNullable();
    table.string("status").notNullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());
    table.dateTime("expired_at");
    table.index("cid");
    table.index("callsign");
  });

  // The flight_plan_revisions table is used to store the historic flight plan details
  await knex.schema.createTable("flight_plan_revisions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("flight_plan_id").notNullable();
    table.jsonb("flight_plan").notNullable();
    table.integer("revision").notNullable();
    table.dateTime("created_at").notNullable().defaultTo(knex.fn.now());

    table.index("flight_plan_id");
    table.index("revision");
    table.unique(["flight_plan_id", "revision"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("flight_plans");
  await knex.schema.dropTable("flight_plan_details");
}

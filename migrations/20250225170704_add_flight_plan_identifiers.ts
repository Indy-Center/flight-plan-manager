import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("flight_plans", (table) => {
    table.string("departure").notNullable();
    table.dateTime("filed_at").notNullable().defaultTo(knex.fn.now());
    table.index(["cid", "callsign", "departure", "filed_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("flight_plans", (table) => {
    table.dropColumn("departure");
    table.dropColumn("filed_at");
    table.dropIndex(["cid", "callsign", "departure", "filed_at"]);
  });
}

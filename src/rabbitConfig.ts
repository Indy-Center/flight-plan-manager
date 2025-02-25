import rascal, { BindingConfig } from "rascal";
import { config } from "./config";

const queues = {
  "flight-plan-manager-queue": {
    options: {
      durable: true,
    },
  },
};

const bindings = [
  "vatsim.events[events.flight_plan.file] -> flight-plan-manager-queue",
  "vatsim.events[events.flight_plan.expire] -> flight-plan-manager-queue",
  "vatsim.events[events.flight_plan.update] -> flight-plan-manager-queue",
];

const subscriptions = {
  "flight-plan-manager-queue": {
    queue: "flight-plan-manager-queue",
  },
};

export default rascal.withDefaultConfig({
  vhosts: {
    "/": {
      connection: {
        url: config.RABBIT_URL,
      },
      exchanges: {
        "vatsim.events": {
          type: "topic",
          options: { durable: true },
        },
      },
      queues,
      subscriptions,
      bindings,
    },
  },
});

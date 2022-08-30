import StatsD from "hot-shots";

export default new StatsD({
  port: 8125,
  host: "telegraf",
  globalTags: {
    service: "client",
  },
});

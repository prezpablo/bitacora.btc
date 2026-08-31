import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  setHeader(event, "cache-control", "no-store");
  setHeader(event, "content-type", "application/json; charset=utf-8");
  return { ok: true, ts: Date.now() };
});

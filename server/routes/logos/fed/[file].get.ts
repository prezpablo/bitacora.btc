import { existsSync, readFileSync } from "node:fs";
import { defineEventHandler, getRouterParam, setHeader, setResponseStatus } from "h3";
import { fedLogoFile } from "../../../../src/infrastructure/fed-logos";

export default defineEventHandler((event) => {
  const file = fedLogoFile(String(getRouterParam(event, "file") || ""));
  if (!file || !existsSync(file)) {
    setResponseStatus(event, 404);
    return "";
  }
  setHeader(event, "content-type", "image/jpeg");
  setHeader(event, "x-content-type-options", "nosniff");
  setHeader(event, "cache-control", "public, max-age=604800");
  return readFileSync(file);
});

import { getPayload } from "payload";
import config from "@payload-config";

// Payload client for use in server components and API routes
export const getPayloadClient = async () => {
  return getPayload({ config: config as any });
};

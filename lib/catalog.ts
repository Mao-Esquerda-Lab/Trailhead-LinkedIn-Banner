import type { TrailItem } from "./trailhead/types";

/** Manual fallback: items without artwork render as a generated emblem; users can upload an image. */
const certs = [
  "Salesforce Certified Administrator",
  "Salesforce Certified Platform App Builder",
  "Salesforce Certified Platform Developer I",
  "Salesforce Certified Platform Developer II",
  "Salesforce Certified Agentforce Specialist",
  "Salesforce Certified Data Cloud Consultant",
  "Salesforce Certified Sales Cloud Consultant",
  "Salesforce Certified Service Cloud Consultant",
  "Salesforce Certified Experience Cloud Consultant",
  "Salesforce Certified AI Associate",
  "Salesforce Certified Marketing Cloud Administrator",
  "Salesforce Certified Integration Architect",
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const CERT_CATALOG: TrailItem[] = certs.map((title) => ({
  id: `certification-${slug(title)}`,
  kind: "certification",
  title,
  imageUrl: "",
}));

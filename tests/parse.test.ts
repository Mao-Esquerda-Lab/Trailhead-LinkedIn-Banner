import { describe, expect, it } from "vitest";
import { parseProfileHtml } from "@/lib/trailhead/parse";
import { parseUsername } from "@/lib/trailhead/username";

describe("parseUsername", () => {
  it("accepts usernames and trailblazer.me URLs", () => {
    expect(parseUsername("maria-silva")).toBe("maria-silva");
    expect(parseUsername("https://www.trailblazer.me/id/maria-silva")).toBe("maria-silva");
    expect(parseUsername("https://www.salesforce.com/trailblazer/laistorres")).toBe("laistorres");
    expect(parseUsername("salesforce.com/trailblazer/laistorres/")).toBe("laistorres");
  });
  it("rejects other hosts", () => {
    expect(parseUsername("https://evil.com/id/x")).toBeNull();
    expect(parseUsername("https://salesforce.com.evil.com/trailblazer/x")).toBeNull();
    expect(parseUsername("https://www.salesforce.com/other/x")).toBeNull();
    expect(parseUsername("http://169.254.169.254/id/x")).toBeNull();
  });
});

describe("parseProfileHtml", () => {
  const html = `
    <meta property="og:title" content="Maria Silva | Trailblazer"/>
    <img src="https://res.cloudinary.com/x/agentforce-specialist.png" alt="Agentforce Specialist badge">
    <img src="https://developer.salesforce.com/resources/credentials/admin.png" alt="Salesforce Certified Administrator">
    <img src="https://x.com/logo.png" alt="logo">
    <script type="application/ld+json">{"items":[{"Title":"Apex Basics badge","ImageUrl":"https://res.cloudinary.com/x/apex.png"}]}</script>`;
  const p = parseProfileHtml(html, "maria-silva");
  it("extracts name and classifies items", () => {
    expect(p.name).toBe("Maria Silva");
    expect(p.items.map((i) => i.kind).sort()).toEqual(["agentforce", "badge", "certification"]);
  });
});

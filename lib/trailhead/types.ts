export type ItemKind = "badge" | "agentforce" | "certification";

export interface TrailItem {
  id: string;
  kind: ItemKind;
  title: string;
  imageUrl: string;
  url?: string;
}

export interface TrailProfile {
  username: string;
  name?: string;
  avatarUrl?: string;
  items: TrailItem[];
}

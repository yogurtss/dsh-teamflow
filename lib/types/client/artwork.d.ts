/** Shared, deterministic role portraits for every AgentTeams surface. */
export declare const ART_BASE = "/plugins/dsh-agent-teams/assets/";
export declare const LEAD_ART: string;
export declare const REVIEW_ART: string;
export declare const ACTION_ART: {
    working: string;
    idle: string;
    unknown: string;
};
/** Role takes precedence over display names; equal roles always share a portrait. */
export declare function memberArtUrl(name: string, role: string): string;

import { EndpointConfig } from "@cds-au/holder-sdk";

export interface DsbEndpoint extends EndpointConfig {
    authScopesRequired?: string | null;
    requiresXFAPIAuthdate?: boolean;
    requiresCDSClientHeader?: boolean;
    requiresXv?: boolean;
    requiresCDSArrangementID?: boolean;
}
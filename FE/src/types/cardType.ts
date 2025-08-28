export interface OrganizationURL {
    href: string;
    title: string;
}
export interface ServiceURL {
    href: string;
    title: string;
}
export interface OrganizationNameParts {
    primary: string;
    secondary: string | null;
}
export interface AddressParts {
    primary: string;
    secondary: string | null;
}

export interface Response {
    id: string;
    name: string;
    synonyms: string[];
}

export interface Situation {
    id: string;
    name: string;
    synonyms: string[];
}
export interface BranchUrl {
    href: string;
    title: string;
}

export interface ICardForBanner {
    card_id:string,
    service_name: string,
    service_description: string,
    responses: Response[],
    situations: Situation[],
}

export interface ICard {
    // Unique identifiers
    card_id: string;
    point_id: string;
    servicesInSameBranch: ICardForBanner[]

    // Location
    address_parts: AddressParts | null;
    branch_address: string;
    branch_city: string;
    branch_description: string | null;
    branch_geometry: [number, number]; // [longitude, latitude]
    branch_location_accurate: boolean;

    // Contact
    branch_phone_numbers: string[];
    branch_email_address: string | null;
    branch_urls: BranchUrl[] | null;

    service_phone_numbers: string[];
    service_email_address: string | null;
    service_urls: ServiceURL[] | null;

    service_payment_details: string | null;
    service_details: string | null;
    service_implements: string | null;

    // Organization
    organization_id: string;
    organization_name: string;
    organization_name_parts: OrganizationNameParts;
    organization_kind: string;
    organization_email_address: string;
    organization_phone_numbers: string[];
    organization_urls: OrganizationURL[];
    organization_branch_count: number;
    organization_short_name: string | null;
    organization_purpose: string | null;

    // Is National Service
    national_service: boolean;

    // General Data
    service_description: string | null;
    branch_name: string | null;
    service_name: string| null;

    // Context / Metadata
    situation_ids: string[];
    situations: Situation[];
    responses: Response[];

    // Warnings / Sources
    data_sources: string[];

    branch_operating_unit: string | null;
}

import {Situation, Response, AddressParts, OrganizationNameParts} from "./cardType";

export interface IBranch {
    id: string;
    name: string;
    address: string;
    isNational: boolean;
    isAccurate: boolean;
    geometry: [number, number];
    responses: Response[];
    situations: Situation[];
    serviceName: string;
    organizationName: string;
    serviceDescription: string;
    address_parts: AddressParts,
    branch_operating_unit: string;
    organization_name_parts: OrganizationNameParts
}

export interface IOrganization {
    id: string;
    name: string;
    branches: IBranch[];
}

export interface IService {
    id:string;
    service_name: string;
    service_description: string;
    responses: Response[];
    situations: Situation[];
    organizations: IOrganization[];
}


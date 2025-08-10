export interface IResponse {
    id: string;
    name: string;
    synonyms: string[];
}

export interface ISituation {
    id: string;
    name: string;
    synonyms: string[];
}
export interface IBranch {
    id: string;
    name: string;
    address: string;
    isNational: boolean;
    isAccurate: boolean;
    geometry: [number, number];
    responses: IResponse[];
    situations: ISituation[];
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
    responses: IResponse[];
    situations: ISituation[];
    organizations: IOrganization[];
    score?: number;
}

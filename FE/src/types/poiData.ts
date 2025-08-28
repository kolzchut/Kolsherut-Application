import {AddressParts, Response, Situation} from "./cardType";

export default interface PoiData {
    cardId: string;
    responses: Response[]
    situations: Situation[]
    branch_geometry: [number, number]
    branch_name: string;
    branch_address: string;
    accurateLocation: boolean;
    organization_name: string;
    service_name: string;
    service_description: string;
    address_parts: AddressParts,
    branch_operating_unit: string;
}

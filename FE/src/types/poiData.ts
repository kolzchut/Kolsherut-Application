import {Response, Situation} from "./cardType";

export default interface PoiData{
    cardId: string;
    responses: Response[]
    situations: Situation[]
    branch_geometry: [number,number]
}
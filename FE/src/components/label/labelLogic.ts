import getColorByResponses from "../../services/map/style/getColorByResponses";
import {Response} from "../../types/cardType";

export const getColor = ({response} :{response?: Response}) => {
    const responseColor = (response && getColorByResponses([response]).background) || "#ffffff";
    const situationColor = window.config.situationsColors;
    const color: string = !!response ? responseColor : situationColor;
    return {isResponse: !!response, color}
}

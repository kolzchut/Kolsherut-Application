import sendMessage from "../../services/sendMessage/sendMessage";
import {IBranch} from "../../types/serviceType";
import {addPOI} from "../../services/map/poiInteraction";
import PoiData from "../../types/poiData";

export const getResultsFromServer = async ({serviceName, responseId, situationId}: {
    serviceName?: string,
    responseId?: string,
    situationId?: string
}) => {
    if (!serviceName && !responseId && !situationId) return [];
    const results = await sendMessage({
        body: {serviceName, responseId, situationId},
        method: 'post',
        requestURL: window.config.routes.search
    });
    if (!results.success) return [];
    return results.data;
}


export const addResultsPOIs = (branches: IBranch[]) => {
    branches.forEach((branch: IBranch) => {
        if (!branch.geometry || !branch.responses || !branch.situations) return;
        const poiData: PoiData = {
            branch_geometry: branch.geometry,
            responses: branch.responses,
            situations: branch.situations,
            cardId: branch.id,
            branch_address: branch.address,
            branch_name: branch.name,
            accurateLocation: branch.isAccurate
        }
        addPOI(poiData)
    });
}


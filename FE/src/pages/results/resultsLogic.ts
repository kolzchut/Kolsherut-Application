import sendMessage from "../../services/sendMessage/sendMessage";
import {IBranch, IService} from "../../types/serviceType";
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

const splitServicesToBranches = (services: IService[]) => {
    const branches: IBranch[] = [];
    services.forEach(service => {
        if (!service.organizations || service.organizations.length === 0) return
        service.organizations.forEach(organization => {
            if (!organization.branches || organization.branches.length === 0) return;
            organization.branches.forEach(branch => {
                const existingBranch = branches.find((b) => b.id === branch.id);
                if (existingBranch) return;
                branches.push(branch)
            })
        })
    });
    return branches;
}

export const addResultsPOIs = (services: IService[]) => {
    const branches = splitServicesToBranches(services);
    branches.forEach((branch) => {
        if(!branch.geometry || !branch.responses || !branch.situations) return;
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

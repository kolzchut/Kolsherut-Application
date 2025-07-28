import {IBranch, IOrganization, IService} from "../../../types/serviceType.ts";
import ILocation from "../../../types/locationType.ts";
import {checkIfCoordinatesInBounds} from "../../../services/geoLogic.ts";
import {checkTags} from "./checkTags.ts";
import israelLocation from "../../../constants/israelLocation.ts";

interface IFilterServicesProps {
    services: IService[];
    filters: {
        responses: string[],
        situations: string[],
        location: ILocation;
    }
}

export const filterServices = ({filters, services}: IFilterServicesProps) => {
    const servicesCopy: IService[] = structuredClone(services);
    const filteredServices: IService[] = [];
    const isSearchingNationWide = filters.location.key === israelLocation.key
    for (const service of servicesCopy) {
        const filteredOrganizations: IOrganization[] = [];
        for (const organization of service.organizations) {
            const filteredBranches = organization.branches.filter((branch: IBranch) => {
                if (!isSearchingNationWide && !checkIfCoordinatesInBounds({
                    bounds: filters.location.bounds,
                    coordinates: branch.geometry
                })) return false;
                if (filters.responses.length > 0 && !checkTags({
                    filters: filters.responses,
                    ids: branch.responses.map(r => r.id),
                    checkAll: !(filters.responses.length > 1)
                })) return false
                if (filters.situations.length > 0 && !checkTags({
                    filters: filters.situations,
                    ids: branch.situations.map(s => s.id),
                    checkAll: false
                })) return false
                return true
            });
            const filteredOrganization: IOrganization = structuredClone(organization);
            filteredOrganization.branches = filteredBranches;
            if (filteredBranches.length > 0) filteredOrganizations.push(filteredOrganization);
        }
        service.organizations = filteredOrganizations;
        if (filteredOrganizations.length > 0) filteredServices.push(service);

    }
    return filteredServices;
}

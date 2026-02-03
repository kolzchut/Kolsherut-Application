import {IBranch, IOrganization, IService} from "../../../types/serviceType";
import ILocation from "../../../types/locationType";
import {checkTags} from "./checkTags";
import israelLocation from "../../../constants/israelLocation";
import {checkIfCoordinatesInBounds} from "../../../services/geoLogic";

interface IFilters {
    responses: string[],
    situations: string[],
    location: ILocation;

}

interface IFilterServicesProps {
    services: IService[];
    filters: IFilters;
    byLocation?: boolean;
    byResponseAndSituation?: boolean;
    includeNational?: boolean;
}

interface IMergeBranchFilters {
    byLocation: boolean;
    byResponseAndSituation: boolean;
    filters: IFilters;
    organization: IOrganization;
    isSearchingNationWide: boolean;
    includeNational: boolean;

}

const filterBranchesByLocation = ({filters, organization, isSearchingNationWide, includeNational}: {
    filters: IFilters,
    organization: IOrganization,
    isSearchingNationWide: boolean
    includeNational: boolean
}) => organization.branches.filter((branch: IBranch) => {
    const autoIncludeByCondition = includeNational ? branch.isNational : isSearchingNationWide;
    return autoIncludeByCondition ||checkIfCoordinatesInBounds({
        bounds: filters.location.bounds,
        coordinates: branch.geometry
    });
});

const filterBranchesByResponseAndSituation = ({filters, organization}: {
    filters: IFilters,
    organization: IOrganization
}) => organization.branches.filter((branch: IBranch) => {
    if (filters.responses.length > 0 && !checkTags({
        filters: filters.responses,
        ids: branch.responses.map(r => r.id),
        checkAll: !(filters.responses.length > 1)
    })) return false
    return !(filters.situations.length > 0 && !checkTags({
        filters: filters.situations,
        ids: branch.situations.map(s => s.id),
        checkAll: false
    }));

});


const mergeBranchFilters = ({byLocation, byResponseAndSituation, filters, organization, isSearchingNationWide, includeNational}: IMergeBranchFilters): IBranch[] => {
    const locationResults = byLocation ? filterBranchesByLocation({filters, organization, isSearchingNationWide, includeNational}) : [];
    const responseResults = byResponseAndSituation ? filterBranchesByResponseAndSituation({filters, organization}) : [];
    if (!byLocation || !byResponseAndSituation) return [...locationResults, ...responseResults];

    return locationResults.filter(branch =>
        responseResults.some(otherBranch => branch.id === otherBranch.id)
    );
};

export const filterServices = ({filters, services, byLocation = false, byResponseAndSituation = false, includeNational=false}: IFilterServicesProps) => {
    const servicesCopy: IService[] = structuredClone(services);
    const filteredServices: IService[] = [];
    const isSearchingNationWide = filters.location.key === israelLocation.key
    for (const service of servicesCopy) {
        const filteredOrganizations: IOrganization[] = [];
        for (const organization of service.organizations) {
            const filteredBranches = mergeBranchFilters({byLocation, byResponseAndSituation, filters, organization, isSearchingNationWide, includeNational});
            const filteredOrganization: IOrganization = structuredClone(organization);
            filteredOrganization.branches = filteredBranches;
            if (filteredBranches.length > 0) filteredOrganizations.push(filteredOrganization);
        }
        service.organizations = filteredOrganizations;
        if (filteredOrganizations.length > 0) filteredServices.push(service);
    }
    return filteredServices;
}

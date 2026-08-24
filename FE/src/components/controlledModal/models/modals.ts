import MoreFiltersModal from "../../../pages/results/filters/components/moreFilters/moreFiltersModal/moreFiltersModal";
import GeoFilterModal from "../../../pages/results/filters/components/geoFilter/geoFilterModal/geoFilterModal";
import SiteMap from "./siteMap/siteMap";


const modals =  {
    GeoFilterModal,
    MoreFiltersModal,
    map:SiteMap,
}

export default modals

export const modalKeys = Object.keys(modals) as Array<keyof typeof modals>;
export type IModals = keyof typeof modals;

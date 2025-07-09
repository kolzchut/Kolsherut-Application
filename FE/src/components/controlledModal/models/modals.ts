import About from "./about/about";
import AddService from "./addService/addService";
import Partners from "./partners/partners";
import Contact from "./contact/contact";
import MoreFiltersModal from "../../../pages/results/filters/components/moreFilters/moreFiltersModal/moreFiltersModal";
import GeoFilterModal from "../../../pages/results/filters/components/geoFilter/geoFilterModal/geoFilterModal";


const modals =  {
    GeoFilterModal,
    MoreFiltersModal,
    About,
    AddService,
    Partners,
    Contact,
}

export default modals

export const modalKeys = Object.keys(modals) as Array<keyof typeof modals>;
export type IModals = keyof typeof modals;

import PoiData from "../../../../types/poiData";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import "./PopupContent.css"

const buildPopupContent = ({feature,root}:{feature: Feature<Geometry>, root: HTMLDivElement }): string => {
    if (!feature || !root) return '';
    root.className = "popup-content-div";

    const props = feature.getProperties() as PoiData;
    return `
      <strong>${props.branch_name}</strong>
      <span>${props.branch_city} , ${props.branch_address}</span>
  `;
};
export default buildPopupContent;

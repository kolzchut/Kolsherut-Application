import PoiData from "../../../../../types/poiData.ts";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import "./cardPopup.css"
import getColorByResponses from "../../getColorByResponses.ts";

const cardPopUp = ({feature,root}:{feature: Feature<Geometry>, root: HTMLDivElement }): string => {
    if (!feature || !root) return '';
    root.className = "popup-content-div";
    const props = feature.getProperties() as PoiData;
    const responses = props.responses;
    const color = getColorByResponses(responses);
    root.style.backgroundColor = color.background;
    root.style.color = color.font;
    return `
      <strong class="popup-content">${props.branch_name}</strong>
  `;
};
export default cardPopUp;

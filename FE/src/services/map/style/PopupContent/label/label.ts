import {Response, Situation} from "../../../../../types/cardType.ts";
import {getColor} from "../../../../colorLogic.ts";
import "./label.css";
import situationIcon from "../../../../../assets/icon-person-blue-5.svg"
import linkIcon from "../../../../../assets/icon-arrow-top-right-gray-4.svg"
interface LabelProps {
    response?: Response;
    situation?: Situation;
    extra?: number;
    accessibilityActive?: boolean;
}

const labelComponent = ({response, situation, extra = 0, accessibilityActive = false}: LabelProps): string => {
    const {isResponse, color} = getColor({response});
    const occasion = response || situation;

    if (!occasion) return '';

    const backgroundColor = `${color}10`;
    const borderColor = `${color}80`;

    const dotHtml = isResponse ? `<span class="label-dot" style="background-color: ${color};"></span>` :
                    `<img alt="situation icon" src="${situationIcon}" class="label-situation-icon"/>`;

    const extraHtml = extra !== 0 ?
        `<span class="label-extra" style="background-color: ${backgroundColor}; border-color: ${borderColor}; font-size: ${accessibilityActive ? '18px' : '14px'};">+${extra}</span>` : '';

    return `
        <div class="label-container">
            <div class="label-content" style="background-color: ${backgroundColor}; border-color: ${borderColor}; font-size: ${accessibilityActive ? '18px' : '14px'};">
                ${dotHtml}
                <span>${occasion.name}</span>
                <img alt="link icon" src="${linkIcon}" class="label-link-icon ${isResponse ? 'response-filter' : ''}"/>
            </div>
            ${extraHtml}
        </div>
    `;
};

export default labelComponent;

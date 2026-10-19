import cardHeaderIcon from "../../../../../assets/cardHeaderIcon.json";


interface IProps {
    organizationName: string;
    serviceId: string;
}
export default ({organizationName, serviceId}:IProps) =>{
    const matches = cardHeaderIcon.filter(icon => icon?.organizationName === organizationName || (icon?.servicePrefix && serviceId.startsWith(icon.servicePrefix)));
    return matches.filter((icon, index) => matches.findIndex(other => other.organizationLogo === icon.organizationLogo) === index);
}

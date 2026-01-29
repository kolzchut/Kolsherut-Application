import cardHeaderIcon from "../../../../../assets/cardHeaderIcon.json";


interface IProps {
    organizationName: string;
    serviceId: string;
}
export default ({organizationName, serviceId}:IProps) =>{
    return cardHeaderIcon.find(icon => icon?.organizationName === organizationName || (icon?.servicePrefix && serviceId.startsWith(icon.servicePrefix)));
}

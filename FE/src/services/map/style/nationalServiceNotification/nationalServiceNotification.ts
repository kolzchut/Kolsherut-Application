import './nationalServiceNotification.css';
import nationalIndicatorsIcon from '../../../../assets/icon-national-service-indicators.svg'
export default ({message}: {message: string}) => {
    const notificationElement = document.createElement('div');
    notificationElement.className = 'map-notification';
    notificationElement.innerHTML = `
    ${message}<img src="${nationalIndicatorsIcon}" alt="National Indicators Icon"/>`;
    return notificationElement;
}

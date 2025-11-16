import useStyle from "./serviceEligibility.css";
import {useTheme} from 'react-jss';
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp";
import sanitizeHTML from "../../../../../services/sanitizeHTML";

const ServiceEligibility = ({serviceDetails, servicePaymentDetails, branchDescription}: {
    serviceDetails: string | null,
    servicePaymentDetails: string | null
    branchDescription: string | null
}) => {
    const serviceEligibilityTitle = window.strings.cardDetails.serviceEligibility;
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    return <div>
        {(serviceDetails || servicePaymentDetails || branchDescription) &&
            <span className={classes.title}>{serviceEligibilityTitle}</span>}
        {serviceDetails && (
            <div
                className={classes.paragraphText}
                dangerouslySetInnerHTML={{__html: sanitizeHTML(serviceDetails)}}
            />
        )}
        {servicePaymentDetails && (
            <div
                className={classes.paragraphText}
                dangerouslySetInnerHTML={{__html: sanitizeHTML(servicePaymentDetails)}}
            />
        )}
        {branchDescription && (
            <div
                className={classes.paragraphText}
                dangerouslySetInnerHTML={{__html: sanitizeHTML(branchDescription)}}
            />
        )}
    </div>
}
export default ServiceEligibility;

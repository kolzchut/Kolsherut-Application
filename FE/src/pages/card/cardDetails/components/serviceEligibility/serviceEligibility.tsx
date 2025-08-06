import useStyle from "./serviceEligibility.css";
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";

const ServiceEligibility = ({serviceDetails, servicePaymentDetails, branchDescription}: {
    serviceDetails: string | null,
    servicePaymentDetails: string | null
    branchDescription: string | null
}) => {
    const serviceEligibilityTitle = window.strings.cardDetails.serviceEligibility;
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    return <div>
        <span className={classes.title}>{serviceEligibilityTitle}</span>
        {serviceDetails && <p className={classes.paragraphText}>{serviceDetails}</p>}
        {servicePaymentDetails && <p className={classes.paragraphText}>{servicePaymentDetails}</p>}
        {branchDescription && <p className={classes.paragraphText}>{branchDescription}</p>}
    </div>
}
export default ServiceEligibility;

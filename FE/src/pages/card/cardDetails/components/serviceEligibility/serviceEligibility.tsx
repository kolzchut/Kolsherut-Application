import useStyle from "./serviceEligibility.css";

const ServiceEligibility = ({serviceDetails, servicePaymentDetails, branchDescription}: {
    serviceDetails: string | null,
    servicePaymentDetails: string | null
    branchDescription: string | null
}) => {
    const serviceEligibilityTitle = window.strings.cardDetails.serviceEligibility;
    const classes = useStyle();
    return <div>
        <span className={classes.title}>{serviceEligibilityTitle}</span>
        {serviceDetails && <p className={classes.paragraphText}>{serviceDetails}</p>}
        {servicePaymentDetails && <p className={classes.paragraphText}>{servicePaymentDetails}</p>}
        {branchDescription && <p className={classes.paragraphText}>{branchDescription}</p>}
    </div>
}
export default ServiceEligibility;

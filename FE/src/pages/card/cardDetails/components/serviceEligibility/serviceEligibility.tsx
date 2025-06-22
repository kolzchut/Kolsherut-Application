const ServiceEligibility = ({serviceDetails, servicePaymentDetails}: {
    serviceDetails: string | null,
    servicePaymentDetails: string | null
}) => {
    const serviceEligibilityTitle = window.strings.cardDetails.serviceEligibility;

    return <div>
        <span>{serviceEligibilityTitle}</span>
        {serviceDetails && <p>{serviceDetails}</p>}
        {servicePaymentDetails && <p>{servicePaymentDetails}</p>}
    </div>
}
export default ServiceEligibility;

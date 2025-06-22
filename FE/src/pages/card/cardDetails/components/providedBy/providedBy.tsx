import {OrganizationURL} from "../../../../../types/cardType";

const ProvidedBy = ({organizationName, organizationUrls, organizationPhoneNumbers, organizationEmailAddress}: {
    organizationName: string;
    organizationUrls: OrganizationURL[],
    organizationPhoneNumbers: string[],
    organizationEmailAddress: string
}) => {
    const providedByTitle = window.strings.cardDetails.providedBy;

    return <div>
        <span>{providedByTitle}</span>
        <div>
            {organizationUrls && organizationUrls.map((url) => (
                <a key={url.href} href={url.href} target="_blank" rel="noopener noreferrer">
                    {organizationName}
                </a>
            ))}
            {organizationPhoneNumbers.map((phoneNumber) => (
                <a key={phoneNumber} href={`tel:${phoneNumber}`}>
                    <span>{phoneNumber}</span>
                </a>
            ))}
            {organizationEmailAddress && (
                <a href={`mailto:${organizationEmailAddress}`}>
                    <span>{organizationEmailAddress}</span>
                </a>
            )}
        </div>
    </div>
}
export default ProvidedBy;

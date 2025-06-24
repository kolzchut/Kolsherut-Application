import {ICard} from "../../../types/cardType";
import useStyle from "./cardDetails.css";

const CardDetails = ({card}: { card: ICard }) => {
    const classes = useStyle();
    const constantText = {
        serviceEssence: window.strings.cardDetails.serviceEssence,
        targetAudience: window.strings.cardDetails.targetAudience,
        contactDetails: window.strings.cardDetails.contactDetails,
        serviceEligibility: window.strings.cardDetails.serviceEligibility,
        providedBy: window.strings.cardDetails.providedBy,
        dataErrorReport: window.strings.cardDetails.dataErrorReport,
    }
    const email = card.service_email_address || card.organization_email_address;
    //TODO: make more readable
    return (<section className={classes.root}>
        <div>
            <h2>{card.organization_name}</h2>
        </div>
        <div>
            <h4>{card.service_name}</h4>
            <p>{card.service_description}</p>
            <div>
                <span>{constantText.serviceEssence}</span>
                {card.responses.map((response => (
                    <div key={response.id}>
                        <h5>{response.name}</h5>
                    </div>
                )))}
            </div>
            <div>
                <span>{constantText.targetAudience}</span>
                {card.situations.map((situation => (
                    <div key={situation.id}>
                        <h5>{situation.name}</h5>
                    </div>
                )))}
            </div>
            <div>
                <span>{constantText.contactDetails}:</span>
                {card.service_phone_numbers.map((phoneNumber) => (
                    <a key={phoneNumber} href={`tel:${phoneNumber}`}>
                        <span>{phoneNumber}</span>
                    </a>
                ))}
                {email && (
                    <a href={`mailto:${email}`}>
                        <span>{email}</span>
                    </a>
                )}
            </div>
            <div>
                <span>{constantText.serviceEligibility}</span>
                {card.service_details && (
                    <p>{card.service_details}</p>
                )}
                {card.service_payment_details && (
                    <p>{card.service_payment_details}</p>
                )}
            </div>
            <div>
                <span>{constantText.providedBy}</span>
                <div>
                    {card.organization_urls && card.organization_urls.map((url) => (
                        <a key={url.href} href={url.href} target="_blank" rel="noopener noreferrer">
                            {card.organization_name}
                        </a>
                    ))}
                    {card.organization_phone_numbers.map((phoneNumber) => (
                        <a key={phoneNumber} href={`tel:${phoneNumber}`}>
                            <span>{phoneNumber}</span>
                        </a>
                    ))}
                    {card.organization_email_address && (
                        <a href={`mailto:${card.organization_email_address}`}>
                            <span>{card.organization_email_address}</span>
                        </a>
                    )}
                </div>
                <div>
                    {card.data_sources && card.data_sources.map((source, index) => (
                    <span key={index}>
                        {source}
                    </span>
                ))}
                </div>
            </div>
        </div>
    </section>)
}
export default CardDetails;

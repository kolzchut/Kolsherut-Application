import {ICard} from "../../../types/cardType";
import useStyle from "./cardDetails.css";
import ServiceEssence from "./components/serviceEssence/serviceEssence";
import TargetAudience from "./components/targetAudience/targetAudience";
import Contact from "./components/contact/contact";
import ServiceEligibility from "./components/serviceEligibility/serviceEligibility";
import ProvidedBy from "./components/providedBy/providedBy";
import DataSource from "./components/dataSource/dataSource";

const CardDetails = ({card}: { card: ICard }) => {
    const classes = useStyle();
    const email = card.service_email_address || card.organization_email_address;
    return <section className={classes.root}>
        <div>
            <h2>{card.organization_name}</h2>
        </div>
        <div>
            <h4>{card.service_name}</h4>
            <p>{card.service_description}</p>
            <ServiceEssence responses={card.responses}/>
            <TargetAudience situations={card.situations}/>
            <Contact email={email} servicePhoneNumbers={card.service_phone_numbers}/>
            <ServiceEligibility serviceDetails={card.service_details}
                                servicePaymentDetails={card.service_payment_details}/>
            <ProvidedBy organizationUrls={card.organization_urls}
                        organizationEmailAddress={card.organization_email_address}
                        organizationName={card.organization_name}
                        organizationPhoneNumbers={card.organization_phone_numbers}/>
            <DataSource dataSource={card.data_sources}/>
        </div>
</section>

}
export default CardDetails;

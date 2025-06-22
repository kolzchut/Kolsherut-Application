import {ICard} from "../../../types/cardType";
import useStyle from "./cardDetails.css";
import ServiceEssence from "./components/serviceEssence/serviceEssence";
import TargetAudience from "./components/targetAudience/targetAudience";
import Contact from "./components/contact/contact";
import ServiceEligibility from "./components/serviceEligibility/serviceEligibility";
import ProvidedBy from "./components/providedBy/providedBy";
import DataSource from "./components/dataSource/dataSource";
import Header from "./components/header/header";

const CardDetails = ({card}: { card: ICard }) => {
    const classes = useStyle();
    const email = card.service_email_address || card.organization_email_address;
    return <section className={classes.root}>
        <Header organizationName={card.organization_name} branchLocationAccurate={card.branch_location_accurate}
                branchAddress={card.branch_address}/>
        <div className={classes.content}>
            <h1 className={classes.serviceNameText}>{card.service_name}</h1>
            <p className={classes.serviceDescriptionText}>{card.service_description}</p>
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

import {BranchUrl, ICard} from "../../../types/cardType";
import useStyle from "./cardDetails.css";
import ServiceEssence from "./components/serviceEssence/serviceEssence";
import TargetAudience from "./components/targetAudience/targetAudience";
import Contact from "./components/contact/contact";
import ServiceEligibility from "./components/serviceEligibility/serviceEligibility";
import ProvidedBy from "./components/providedBy/providedBy";
import DataSource from "./components/dataSource/dataSource";
import Header from "./components/header/header";
import JotForm from "./components/jotForm/jotForm";
import MoreServicesInBranch from "./components/moreServicesInBranch/moreServicesInBranch";
import Footer from "../../../components/footer/footer";
import QuickAction from "./components/quickActions/quickAction";
import {useEffect, useRef, useState} from "react";
import { useTheme } from 'react-jss';
import IDynamicThemeApp from "../../../types/dynamicThemeApp.ts";

const CardDetails = ({card}: { card: ICard }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isScrollUp, setIsScrollUp] = useState(false);
    const previousScrollTop = useRef(0);
    useEffect(() => {
        const div = scrollRef.current;
        if (!div) return;

        const handleScroll = () => {
            const currentScrollTop = div.scrollTop;

            if (currentScrollTop < previousScrollTop.current) {
                setIsScrollUp(true);
            } else {
                setIsScrollUp(false);
            }

            previousScrollTop.current = currentScrollTop;
        };

        div.addEventListener('scroll', handleScroll);

        return () => {
            div.removeEventListener('scroll', handleScroll);
        };
    }, []);


    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    const email: string = card.branch_email_address || card.service_email_address || card.organization_email_address;
    const websites: BranchUrl[] = [card.branch_urls, card.organization_urls, card.service_urls].find(arr => {
        if (arr === null) return;
        return arr.length > 0
    }) || [];
    const phoneNumbers: string[] = [card.branch_phone_numbers, card.organization_phone_numbers, card.service_phone_numbers].find(arr => arr.length > 0) || [];
    const address = {text: card.branch_address, geom: card.branch_geometry};
    return <section ref={scrollRef} className={classes.root}>
        <Header branchOperatingUnit={card.branch_operating_unit || card.branch_name ||  card.organization_name} isNational={card.national_service}
                branchLocationAccurate={card.branch_location_accurate}
                organizationName={card.organization_name}
                addressParts={card.address_parts || card.branch_address}/>
        <div className={classes.content}>
            <h1 className={classes.serviceNameText}>{card.service_name}</h1>
            {card.branch_name && <h2 className={classes.branchNameText}>{card.branch_name}</h2>}
            <p className={classes.serviceDescriptionText}>{card.service_description}</p>
            <ServiceEssence responses={card.responses}/>
            <TargetAudience situations={card.situations}/>
            <Contact card={card} email={email} phoneNumbers={phoneNumbers} address={address}
                     websites={websites}/>
            <ServiceEligibility serviceDetails={card.service_details}
                                servicePaymentDetails={card.service_payment_details}
                                branchDescription={card.branch_description}/>
            <ProvidedBy organizationNameParts={card.organization_name_parts}
                        organizationName={card.organization_name}
                        organizationUrls={card.organization_urls}
                        organizationEmailAddress={card.organization_email_address}
                        organizationPhoneNumbers={card.organization_phone_numbers}/>
            <DataSource dataSource={card.data_sources}/>
            <JotForm cardId={card.card_id} serviceName={card.service_name || ""}/>

        </div>
        {card.servicesInSameBranch.length > 0 &&
            <MoreServicesInBranch moreServicesInBranch={card.servicesInSameBranch}/>}
        <Footer hideLinks={true}/>
        <div className={`${classes.quickActionContainer} ${isScrollUp ? classes.hidden : ""}`}>
            <QuickAction email={email} phoneNumber={phoneNumbers[0]} websiteURL={websites[0]?.href}/>
        </div>
    </section>

}
export default CardDetails;

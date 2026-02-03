import {OrganizationNameParts, OrganizationURL} from "../../../../../types/cardType";
import useStyle from "./providedBy.css";
import linkIcon from "../../../../../assets/icon-external-link-blue.svg";
import phoneIcon from "../../../../../assets/icon-call-blue.svg"
import emailIcon from "../../../../../assets/icon-mail-blue.svg"
import {useEffect, useState} from "react";
import openIcon from "../../../../../assets/icon-chevron-down-blue.svg";
import ArrowDirection from "./arrowDirectionEnum";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp";

interface IProps {
    organizationNameParts: OrganizationNameParts;
    organizationName: string,
    organizationUrls: OrganizationURL[],
    organizationPhoneNumbers: string[],
    organizationEmailAddress: string
}


const ProvidedBy = ({
                        organizationNameParts,
                        organizationName,
                        organizationUrls,
                        organizationPhoneNumbers,
                        organizationEmailAddress
                    }: IProps) => {
    const theme = useTheme<IDynamicThemeApp>();
    const providedByTitle = window.strings.cardDetails.providedBy;
    const isOrgUrlAvailable: boolean = !!(organizationUrls && organizationUrls.length > 0 && organizationUrls[0].href)
    const noEmailAndNoPhone: boolean = !organizationEmailAddress && (!organizationPhoneNumbers || organizationPhoneNumbers.length < 1)
    const [arrowDirection, setArrowDirection] = useState<ArrowDirection>(ArrowDirection.Close);

    useEffect(() => {
        if (noEmailAndNoPhone) setArrowDirection(ArrowDirection.NotDisplayed);
    }, []);

    const handleToggle = () => setArrowDirection((prevState) => prevState === ArrowDirection.Open ? ArrowDirection.Close : ArrowDirection.Open)

    const classes = useStyle({arrow: arrowDirection, accessibilityActive: theme.accessibilityActive});
    return <div>
        <span className={classes.title}>{providedByTitle}</span>
        <div className={classes.mainDiv}>
            {arrowDirection !== ArrowDirection.NotDisplayed && (
                <img src={openIcon} className={classes.arrow} alt={"Toggle Details"} onClick={handleToggle}/>
            )}
            {organizationNameParts && !isOrgUrlAvailable && (<>
                {organizationNameParts.primary && <span>{organizationNameParts.primary}</span>}
                {organizationNameParts.secondary && <span> - {organizationNameParts.secondary}</span>}
            </>)}
            {organizationNameParts && isOrgUrlAvailable && (
                <a className={classes.link} href={organizationUrls[0].href} target="_blank" rel="noopener noreferrer">
                    {organizationNameParts.primary}
                    <img src={linkIcon} alt={"link to organization"} className={classes.linkIcon}/>
                </a>)}
            {!organizationNameParts && isOrgUrlAvailable && (
                <a className={classes.link} href={organizationUrls[0].href} target="_blank">
                    {organizationName}
                </a>
            )}
            {!organizationNameParts && !isOrgUrlAvailable && (
                <span>{organizationName}</span>
            )}
            {arrowDirection === ArrowDirection.Open && (
                <div className={classes.hiddenLinksDiv}>
                    {organizationPhoneNumbers.map((phoneNumber) => (
                        <a href={`tel:${phoneNumber}`} key={phoneNumber} className={`${classes.link} ${classes.hiddenLinks}`}>
                            <img src={phoneIcon} alt={"link to phone number"}
                                 className={classes.linkIcon}/> {phoneNumber}
                        </a>
                    ))}
                    {organizationEmailAddress && (
                        <a href={`mailto:${organizationEmailAddress}`} className={`${classes.link} ${classes.hiddenLinks}`}>
                            <img src={emailIcon} alt={"link to email"}
                                 className={classes.linkIcon}/> {organizationEmailAddress}
                        </a>
                    )}
                </div>
            )}
        </div>
    </div>
}
export default ProvidedBy;

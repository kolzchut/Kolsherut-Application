import useStyle from "./header.css";
import backIcon from "../../../../../assets/icon-arrow-right.svg";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import {AddressParts, OrganizationNameParts} from "../../../../../types/cardType.ts";
import cardHeaderIcon from "../../../../../assets/cardHeaderIcon.json";
import {createKeyboardHandler} from "../../../../../services/keyboardHandler";

const Header = ({branchOperatingUnit, addressParts, isNational, organizationName, organizationNameParts}: {
    branchOperatingUnit: string,
    addressParts: AddressParts | string,
    organizationName: string,
    organizationNameParts: OrganizationNameParts,
    isNational: boolean
}) => {
    const serviceGivenNationWide = window.strings.cardDetails.serviceGivenNationWide
    const onBackButtonClick = () => window.history.back();
    const handleKeyDown = createKeyboardHandler(onBackButtonClick);
    const theme = useTheme<IDynamicThemeApp>();
    const iconSource = cardHeaderIcon.find(icon => icon.organizationName === organizationName);
    const isStringAddressParts = typeof addressParts === 'string';

    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    return <div className={classes.root}>
        <div className={classes.backButtonDiv}>
            <button
                onClick={onBackButtonClick}
                onKeyDown={handleKeyDown}
                className={classes.backButton}
                aria-label="Go back"
            >
                <img className={classes.backButtonImg}
                     src={backIcon}
                     alt={"go back"}/>
            </button>
        </div>
        <div className={classes.header}>
            {branchOperatingUnit && <span className={classes.headerTitle}>{branchOperatingUnit} </span>}
            {!branchOperatingUnit && organizationNameParts && <div>
                <span className={classes.headerTitle}>{organizationNameParts.primary}</span>
                {organizationNameParts.primary && organizationNameParts.secondary && " - "}
                <span className={classes.headerSubtitle}>{organizationNameParts.secondary} </span>
            </div>
            }
            {!isNational && isStringAddressParts && <span className={classes.headerTitle}>{addressParts}</span>}
            {!isNational && !isStringAddressParts && <div>
                <span className={classes.headerTitle}>{(addressParts as unknown as AddressParts).primary} </span>
                {addressParts.primary && addressParts.secondary && " - "}
                <span className={classes.headerSubtitle}>{(addressParts as unknown as AddressParts).secondary}</span>
            </div>}
            {isNational && <span className={`${classes.nationWideText}`}> {serviceGivenNationWide}</span>}
        </div>
        {iconSource &&
            <img className={classes.headerIcon} src={iconSource.organizationLogo} alt={iconSource.organizationName}/>}
    </div>
}
export default Header;

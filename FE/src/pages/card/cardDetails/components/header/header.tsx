import useStyle from "./header.css";
import backIcon from "../../../../../assets/icon-arrow-right.svg";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import {AddressParts} from "../../../../../types/cardType.ts";
import cardHeaderIcon from "../../../../../assets/cardHeaderIcon.json";
const Header = ({branchOperatingUnit, addressParts, branchLocationAccurate, isNational,organizationName}: {
    branchOperatingUnit: string,
    addressParts: AddressParts | string,
    branchLocationAccurate: boolean,
    organizationName: string,
    isNational: boolean
}) => {
    const notAccurateLocation = window.strings.cardDetails.notAccurateLocation;
    const serviceGivenNationWide = window.strings.cardDetails.serviceGivenNationWide
    const showNoAccurateLocation = !branchLocationAccurate && !isNational;
    const onBackButtonClick = () => window.history.back();
    const theme = useTheme<IDynamicThemeApp>();
    const iconSource = cardHeaderIcon.find(icon => icon.organizationName === organizationName);
    const isStringAddressParts = typeof addressParts === 'string';

    const classes = useStyle({accessibilityActive: theme.accessibilityActive});
    return <div className={classes.root}>
        <div className={classes.backButtonDiv}>
            <button onClick={onBackButtonClick} className={classes.backButton}>
                <img className={classes.backButtonImg}
                     src={backIcon}
                     alt={"go back to results"}/>
            </button>
        </div>
        <div className={classes.header}>
            <span className={classes.headerTitle}>{branchOperatingUnit} </span>
            {!isNational && isStringAddressParts && <span className={classes.headerTitle}>{addressParts}</span>}
            {!isNational && !isStringAddressParts &&
                <span className={classes.headerTitle}>{(addressParts as unknown as AddressParts).primary + " - "}
                    <span className={classes.headerSubtitle}>{(addressParts as unknown as AddressParts).secondary}</span>
                </span>}
            {isNational && <span className={`${classes.nationWideText}`}> {serviceGivenNationWide}</span>}
            {showNoAccurateLocation && <span className={classes.headerSubtitle}> {notAccurateLocation}
                </span>}
        </div>
        {iconSource&& <img className={classes.headerIcon} src={iconSource.organizationLogo} alt={iconSource.organizationName}/>}
    </div>
}
export default Header;

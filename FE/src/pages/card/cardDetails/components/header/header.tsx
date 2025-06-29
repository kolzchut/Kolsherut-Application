import useStyle from "./header.css";

const Header = ({organizationName, branchAddress, branchLocationAccurate, isNational}: {
    organizationName: string,
    branchAddress: string,
    branchLocationAccurate: boolean
    isNational: boolean
}) => {
    const notAccurateLocation = window.strings.cardDetails.notAccurateLocation;
    const serviceGivenNationWide = window.strings.cardDetails.serviceGivenNationWide
    const classes = useStyle();
    const showNoAccurateLocation = !branchLocationAccurate && !isNational;
    return <div className={classes.header}>
            <span className={classes.headerTitle}>{organizationName} {!isNational && branchAddress}</span>
        {isNational && <span className={`${classes.nationWideText}`}> {serviceGivenNationWide}</span>}
        {showNoAccurateLocation && <span className={classes.headerSubtitle}> {notAccurateLocation}
                </span>}

    </div>
}
export default Header;

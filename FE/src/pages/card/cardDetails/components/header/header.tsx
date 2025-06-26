import useStyle from "./header.css";

const Header = ({organizationName, branchAddress, branchLocationAccurate}: {
    organizationName: string,
    branchAddress: string,
    branchLocationAccurate: boolean
}) => {
    const notAccurateLocation = window.strings.cardDetails.notAccurateLocation;
    const classes = useStyle();

    return <div className={classes.header}>
            <span className={classes.headerTitle}>{organizationName} {branchAddress}
                {!branchLocationAccurate && <span className={classes.headerSubtitle}> {notAccurateLocation}
                </span>}
            </span>

    </div>
}
export default Header;

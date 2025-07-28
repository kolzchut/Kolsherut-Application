import useStyle from "./header.css";
import backIcon from "../../../../../assets/icon-arrow-right.svg";
import {backToResults} from "../../../../../store/shared/sharedSlice.ts";
const Header = ({organizationName, branchAddress, branchLocationAccurate, isNational}: {
    organizationName: string,
    branchAddress: string,
    branchLocationAccurate: boolean
    isNational: boolean
}) => {
    const notAccurateLocation = window.strings.cardDetails.notAccurateLocation;
    const serviceGivenNationWide = window.strings.cardDetails.serviceGivenNationWide
    const showNoAccurateLocation = !branchLocationAccurate && !isNational;
    const onBackButtonClick = () =>{
        backToResults();
    }
    const classes = useStyle();
    return <div className={classes.root}>
        <div className={classes.backButtonDiv}>
            <button onClick={onBackButtonClick} className={classes.backButton}><img className={classes.backButtonImg} src={backIcon} alt={"go back to results"}/></button>
        </div>
        <div className={classes.header}>
            <span className={classes.headerTitle}>{organizationName} {!isNational && branchAddress}</span>
            {isNational && <span className={`${classes.nationWideText}`}> {serviceGivenNationWide}</span>}
            {showNoAccurateLocation && <span className={classes.headerSubtitle}> {notAccurateLocation}
                </span>}
        </div>
    </div>
}
export default Header;

import useStyles from "./branch.css";
import {IBranch} from "../../../../types/serviceType";
import nationalIcon from "../../../../assets/icon-headset.svg";
import linkIcon from "../../../../assets/icon-arrow-top-right-gray-4.svg";
import {getHrefForCard} from "../../../../services/href";
import resultsAnalytics from "../../../../services/gtag/resultsEvents";
import {reRouteToCard} from "../../../../services/routes/reRoute";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp.ts";
import {useTheme} from "react-jss";
import React from "react";
import {createKeyboardHandler} from "../../../../services/keyboardHandler";

const Branch = React.forwardRef<HTMLAnchorElement, { branch: IBranch }>(({branch}, ref) => {
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const accurateLocation: string = branch.isAccurate ? "" : window.strings.results.notAccurateLocation;
    const addressText: string = branch.address + " " + accurateLocation;
    const showNational = branch.isNational && !branch.address
    const href = getHrefForCard(branch.id)

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        resultsAnalytics.gotoCardFromBranchList(branch.id)
        reRouteToCard({cardId: branch.id})
    }

    const handleKeyboardClick = () => {
        resultsAnalytics.gotoCardFromBranchList(branch.id)
        reRouteToCard({cardId: branch.id})
    }

    const handleKeyDown = createKeyboardHandler(handleKeyboardClick);

    return <a
        ref={ref}
        href={href}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={classes.mainDiv}
        aria-label={`Go to ${branch.name || 'branch'} details${branch.address ? ` at ${branch.address}` : ''}`}
    >
        <div className={classes.textDiv}>
            {branch.name && <span className={classes.branchName}>{branch.name}</span>}
            {branch.address && <span className={classes.branchAddress}>{addressText} </span>}
            {showNational && <span className={classes.nationalBranch}>{window.strings.results.nationalBranch}</span>}
        </div>
        <div>
            {showNational && <img src={nationalIcon} alt={"national icon"} className={classes.icon}/>}
            <img src={linkIcon} alt={"link icon"} className={classes.icon}/>
        </div>
    </a>
})

Branch.displayName = 'Branch';

export default Branch;

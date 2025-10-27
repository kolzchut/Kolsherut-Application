import useStyles from './moreFiltersModal.css';
import SituationSection from "./situationSection/situationSection";
import {useSelector} from "react-redux";
import {
    getAllSituationsToFilter,
    getFilterResultsLength
} from "../../../../../../store/shared/shared.selector";
import {replaceMacro} from "../../../../../../services/str";
import {onSituationClear, onSituationClick} from "./moreFiltersModalLogic";
import ResponseSection from "./responseSection/responseSection";
import {store} from "../../../../../../store/store";
import {setModal} from "../../../../../../store/general/generalSlice";
import closeIcon from "../../../../../../assets/icon-close-black.svg";
import IDynamicThemeApp from "../../../../../../types/dynamicThemeApp";
import {useTheme} from "react-jss";


const MoreFiltersModal = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive})
    const resultsLength = useSelector(getFilterResultsLength)
    const situationsToFilter= useSelector(getAllSituationsToFilter)
    const numOfResults = replaceMacro({
        stringWithMacro: window.strings.results.resultsAmount,
        macro: "%%MACRO%%",
        replacement: String(resultsLength)
    })

    const close = () => {
        store.dispatch(setModal(null));
    }

    return <div className={classes.mainDiv}>
        <button className={classes.closeIcon} onClick={close}><img src={closeIcon} alt={"close icon"}/></button>
        <div className={classes.innerDiv}>
            <ResponseSection />
            {situationsToFilter.map(([title, situations], index) => (
                <SituationSection key={index} onClick={onSituationClick} onClear={onSituationClear} title={title}
                                  situations={situations}/>
            ))}
        </div>
        <button className={classes.applyButton} onClick={close}>{numOfResults}</button>
    </div>
}
export default MoreFiltersModal;

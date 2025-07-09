import useStyles from './moreFiltersModal.css';
import SituationSection from "./situationSection/situationSection";
import {useSelector} from "react-redux";
import {
    getAllSituationsToFilter,
    getFilterResultsLength
} from "../../../../../../store/shared/shared.selector";
import {removeMacro} from "../../../../../../services/str";
import {onSituationClear, onSituationClick} from "./moreFiltersModalLogic";
import ResponseSection from "./responseSection/responseSection";
import {store} from "../../../../../../store/store";
import {setModal} from "../../../../../../store/general/generalSlice";


const MoreFiltersModal = () => {
    const classes = useStyles()
    const resultsLength = useSelector(getFilterResultsLength)
    const situationsToFilter= useSelector(getAllSituationsToFilter)
    const numOfResults = removeMacro({
        stringWithMacro: window.strings.results.resultsAmount,
        macro: "%%MACRO%%",
        replacement: String(resultsLength)
    })

    const close = () => {
        store.dispatch(setModal(null));
    }

    return <div className={classes.mainDiv}>
        <div className={classes.innerDiv}>
            <ResponseSection />
            {situationsToFilter.map(([title, situations]) => (
                <SituationSection onClick={onSituationClick} onClear={onSituationClear} title={title}
                                  situations={situations}/>
            ))}
        </div>
        <button className={classes.applyButton} onClick={close}>{numOfResults}</button>
    </div>
}
export default MoreFiltersModal;

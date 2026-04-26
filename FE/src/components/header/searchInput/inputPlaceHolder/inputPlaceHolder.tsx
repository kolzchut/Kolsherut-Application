import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp";
import useStyles from "./inputPlaceHolder.css";
import {useSelector} from "react-redux";
import {getBackendByFilter} from "../../../../store/filter/filter.selector";
import {createKeyboardHandler} from "../../../../services/keyboardHandler";
import {getSearchQuery} from "../../../../store/general/general.selector";
import {getFilteredResultsByFilter} from "../../../../store/shared/inputPlaceHolderSelector.ts";

interface IPlaceHolderText {
    responseSentence?: string;
    situationSentence?: string;
    bySentence?: string;
}

const InputPlaceHolder = ({onClick}: { onClick: () => void }) => {
    const theme = useTheme<IDynamicThemeApp>();
    const searchQuery = useSelector(getSearchQuery)
    const names = useSelector(getFilteredResultsByFilter)
    const byFilter = useSelector(getBackendByFilter)
    const handleKeyDown = createKeyboardHandler(onClick);

    const queryWithoutUnderscores = searchQuery.replace(/_/g, " ");
    const responseAndSituation = queryWithoutUnderscores.replace(/_/g, " ").split(window.strings.searchQueryTextDefaults.baseSituationSentence)

    const {baseSituationSentence} = window.strings.searchQueryTextDefaults
    let text: IPlaceHolderText = {
        responseSentence: names.response || window.strings.searchQueryTextDefaults.serviceSentence,
        situationSentence: names.situation || responseAndSituation[1] || window.strings.searchQueryTextDefaults.forSentence,
        bySentence: byFilter && (window.strings.searchQueryTextDefaults.connectBySentence + " " +byFilter),
    }
    if(!names.response && !names.situation && !byFilter) text ={responseSentence: queryWithoutUnderscores}


    const classes = useStyles({theme});
    return <div
        className={classes.mainDiv}
        onClick={onClick}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label="Search input placeholder"
    >
        {text.responseSentence && <span className={classes.firstSentence}>{text.responseSentence}</span>}
        <div className={classes.bottomDiv}>
            {text.situationSentence &&
                <span className={classes.secondSentence}>{baseSituationSentence + " " + text.situationSentence}</span>}
            {text.bySentence && <span className={classes.secondSentence}>{text.bySentence}</span>}
        </div>
    </div>
}
export default InputPlaceHolder;

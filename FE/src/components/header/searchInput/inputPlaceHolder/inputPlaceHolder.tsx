import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp.ts";
import useStyles from "./inputPlaceHolder.css.ts";
import {useSelector} from "react-redux";
import {getSearchQuery} from "../../../../store/general/general.selector.ts";
import {getLocationFilter} from "../../../../store/filter/filter.selector.ts";
import {checkIfLocationKeyEqualsToWord, parseSearchQueryToSentences} from "./inputPlaceHolderLogic.ts";

const InputPlaceHolder = ({onClick}: { onClick: () => void }) => {
    const theme = useTheme<IDynamicThemeApp>();
    const searchQuery = useSelector(getSearchQuery);
    const locationFilter = useSelector(getLocationFilter);
    const searchQueryArray = searchQuery
        .split('_')
        .filter((word) => !checkIfLocationKeyEqualsToWord({locationKey: locationFilter.key, word}));
    const forSeparators: string[] = window.config.searchQueryForSeparators;
    const bySeparators: string[] = window.config.searchQueryBySeparators;

    const text = parseSearchQueryToSentences({
        searchQueryArray,
        forSeparators,
        bySeparators
    });

    const classes = useStyles({theme});
    return <div className={classes.mainDiv} onClick={onClick}>
        {text.serviceSentence && <h1 className={classes.firstSentence}>{text.serviceSentence}</h1>}
        <div className={classes.bottomDiv}>
            {text.forSentence && <h2 className={classes.secondSentence}>{text.forSentence}</h2>}
            {text.bySentence && <h3 className={classes.secondSentence}>{text.bySentence}</h3>}
        </div>
    </div>
}
export default InputPlaceHolder;

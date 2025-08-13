import {useState} from "react";
import useStyles from "./situationSection.css";
import ISituationsToFilter from "../../../../../../../types/SituationsToFilter";
import {uniqueBy} from "../../../../../../../services/arr";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../../../types/dynamicThemeApp.ts";
import {createKeyboardHandler} from "../../../../../../../services/keyboardHandler";

interface IProps {
    title: string,
    situations: ISituationsToFilter[],
    onClick: ({situation}: { situation: ISituationsToFilter }) => void,
    onClear: ({situations}: { situations: ISituationsToFilter[] }) => void
}

const SituationSection = ({title, situations, onClick, onClear}: IProps) => {
    const cleanup = window.strings.results.cleanup
    const showMore = window.strings.results.showMore
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const fixedSituations = uniqueBy({arr: situations, key: "id"})
    const [amountOfSituationsToDisplay, setAmountOfSituationsToDisplay] = useState(Math.min(fixedSituations.length, 5));
    const situationsToDisplay = fixedSituations.slice(0, amountOfSituationsToDisplay);
    const inputDescription = "Filter by: ";

    const handleClearKeyDown = createKeyboardHandler(() => onClear({situations: fixedSituations}));
    const handleShowMoreKeyDown = createKeyboardHandler(() => setAmountOfSituationsToDisplay(fixedSituations.length));

    return <div className={classes.mainDiv}>
        <div className={classes.titleDiv}>
            <span className={classes.title}>{title}</span>
            <span
                className={classes.cleanup}
                onClick={() => onClear({situations: fixedSituations})}
                onKeyDown={handleClearKeyDown}
                tabIndex={0}
                role="button"
                aria-label={`Clear all ${title} filters`}
            >
                {cleanup}
            </span>
        </div>
        <div className={classes.labelContainer}>
            {situationsToDisplay.map((situation: ISituationsToFilter, index: number) => (
                <div className={classes.label} key={index} onClick={() => onClick({situation})}>
                    <label
                        htmlFor={`checkbox-${situation.id}`}
                        className={classes.visuallyHidden}
                    >
                        {inputDescription}
                    </label>
                    <input
                        id={`checkbox-${situation.id}`}
                        className={classes.checkBox}
                        type="checkbox"
                        readOnly
                        checked={situation.selected}
                    />
                    <span>{situation.name}</span>
                </div>
            ))}
            {amountOfSituationsToDisplay < fixedSituations.length &&
                <span
                    className={classes.showMore}
                    onClick={() => setAmountOfSituationsToDisplay(fixedSituations.length)}
                    onKeyDown={handleShowMoreKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label={`Show ${fixedSituations.length - amountOfSituationsToDisplay} more ${title} options`}
                >
                    {showMore} ({fixedSituations.length - amountOfSituationsToDisplay})
                </span>}
        </div>
    </div>
}
export default SituationSection;

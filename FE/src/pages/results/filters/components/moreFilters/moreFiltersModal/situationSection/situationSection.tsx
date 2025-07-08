import {useState} from "react";
import useStyles from "./situationSection.css";
import ISituationsToFilter from "../../../../../../../types/SituationsToFilter";

interface IProps {
    title: string,
    situations: ISituationsToFilter[],
    onClick: ({situation}: { situation: ISituationsToFilter }) => void,
    onClear: ({situations}:{situations: ISituationsToFilter[]}) => void
}

const SituationSection = ({title, situations, onClick, onClear}: IProps) => {
    const cleanup = window.strings.results.cleanup
    const showMore = window.strings.results.showMore
    const classes = useStyles();
    const [amountOfSituationsToDisplay, setAmountOfSituationsToDisplay] = useState(Math.min(situations.length, 5));
    const situationsToDisplay = situations.slice(0, amountOfSituationsToDisplay);

    return <div className={classes.mainDiv}>
        <div className={classes.titleDiv}>
            <span className={classes.title}>{title}</span>
            <span className={classes.cleanup} onClick={() => onClear({situations})}>{cleanup}</span>
        </div>
        <div className={classes.labelContainer}>
            {situationsToDisplay.map((situation) => (
                <div className={classes.label} key={situation.id} onClick={() => onClick({situation})}>
                    <input
                        className={classes.checkBox}
                        type={"checkbox"}
                        readOnly={true}
                        checked={situation.selected}
                    />
                    <span>{situation.name}</span>
                </div>
            ))}
            {amountOfSituationsToDisplay < situations.length &&
                <span className={classes.showMore} onClick={() => setAmountOfSituationsToDisplay(situations.length)}>
                {showMore} ({situations.length - amountOfSituationsToDisplay})</span>}
        </div>
    </div>
}
            
export default SituationSection;
    

import useStyles from "./singleFilter.css";
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../../../../../store/general/general.selector.ts";

const SingleFilter = ({value, onClick, isFilterActive}: {
    value: { count?: number | string, name: string },
    onClick: () => void,
    isFilterActive: boolean
}) => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({accessibilityActive});

    return <div onClick={onClick} className={classes.optionDiv}>
                    <span className={classes.optionText}>
                        <input
                            id={`checkbox-${value.name}`}
                            className={classes.checkBox}
                            type={"checkbox"}
                            readOnly={true}
                            checked={isFilterActive}
                        />
                        <label htmlFor={`checkbox-${value.name}`} className={classes.visuallyHidden}>
                            {value.name}
                        </label>
                        {value.name}
                    </span>
        {!isFilterActive && value.count != undefined && value.count != 0 &&
            <span className={classes.optionValue}>{value.count}</span>}
    </div>

}
export default SingleFilter;

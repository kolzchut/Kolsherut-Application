import useStyles from "./singleFilter.css";
import IDynamicThemeApp from "../../../../../../types/dynamicThemeApp.ts";
import {useTheme} from "react-jss";

const SingleFilter = ({value, onClick, isFilterActive}: {
    value: { count?: number | string, name: string },
    onClick: () => void,
    isFilterActive: boolean
}) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});

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
                        {' ' + value.name}
                    </span>
        {!isFilterActive && value.count != undefined &&
            <span className={classes.optionValue}>{value.count}</span>}
    </div>

}
export default SingleFilter;

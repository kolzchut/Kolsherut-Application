import useStyles from "./singleFilter.css";
import IDynamicThemeApp from "../../../../../../types/dynamicThemeApp.ts";
import {useTheme} from "react-jss";

const SingleFilter = ({value, onClick, href, isFilterActive}: {
    value: { count?: number | string, name: string },
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void,
    href: string,
    isFilterActive: boolean
}) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});


    return <a onClick={onClick} href={href} className={classes.optionDiv}>
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
    </a>

}
export default SingleFilter;

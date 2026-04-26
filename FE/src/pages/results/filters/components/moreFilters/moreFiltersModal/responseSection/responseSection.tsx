import {useSelector} from "react-redux";
import {getMoreFiltersResponseOptions} from "../../../../../../../store/shared/shared.selector";
import ResponseSectionButton from "./responseSectionButtons/responseSectionButtons";
import useStyles from "./responseSection.css";
import IResponseToFilter from "../../../../../../../types/ResponseToFilter";
import {store} from "../../../../../../../store/store";
import {
    addMultipleResponseFilters,
    removeMultipleResponseFilters
} from "../../../../../../../store/filter/filterSlice";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../../../types/dynamicThemeApp";

const ResponseSection = () => {
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const responseOptions = useSelector(getMoreFiltersResponseOptions);
    const onClick = (responses: IResponseToFilter[]) => {
        const isSelected = responses.some((response) => response.selected);
        const ids = responses.map(r => r.id)
        if (isSelected) return store.dispatch(removeMultipleResponseFilters(ids))
        store.dispatch(addMultipleResponseFilters(ids))
    }
    return (
        <div className={classes.mainDiv}>
            <div className={classes.responseOptionsContainer}>
                {responseOptions.map(([title, responses], index) => (
                    <div key={index} className={classes.sectionDiv}>
                        <span className={classes.title} role="button" tabIndex={0} onClick={() => onClick(responses)}>{title}</span>
                        {responses.map((response) => (
                            <ResponseSectionButton isSelected={response.selected} response={response}
                                                   key={response.id}/>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default ResponseSection;

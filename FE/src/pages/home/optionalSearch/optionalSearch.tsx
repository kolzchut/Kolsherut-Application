import useStyle from "./optionalSearch.css";
import {useSelector} from "react-redux";
import {getSearchOptions} from "../../../store/general/general.selector";
import SearchValue from "../../../types/searchValue";
import {useState} from "react";

const OptionalSearch = () => {
    const classes = useStyle();
    const [selected, setSelected] = useState<string>("");
    const optionalSearchValues = useSelector(getSearchOptions) as Record<string, SearchValue[]>;

    return (
        <div className={classes.root}>
            {Object.values(optionalSearchValues).map((group: SearchValue[]) => (
                <div className={classes.group} key={group[0].group}>
                    <h3 className={classes.groupTitle}>{group[0].group}</h3>
                    <div className={classes.optionalSearchValuesWrapper}>
                        {group.filter((value: SearchValue) => value.title && value.query).map((value: SearchValue, index: number) => (
                            <div
                                key={index}
                                className={`${classes.optionalSearchValue} ${selected === value.query ? classes.selected : ''}`}
                                onClick={() => setSelected(value.query)}>
                                    <span>{value.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OptionalSearch;
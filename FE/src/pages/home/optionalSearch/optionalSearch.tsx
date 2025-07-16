import useStyle from "./optionalSearch.css";
import {IGroup} from "../../../types/homepageType.ts";
import Group from "./group/group"

const OptionalSearch = () => {
    const classes = useStyle();
    const optionalSearchValues = window.homepage;
    return (
        <div className={classes.root}>
            {Object.values(optionalSearchValues).map((group: IGroup, index:number) => (
                <Group key={index} group={group}/>
            ))}
        </div>
    );
};

export default OptionalSearch;

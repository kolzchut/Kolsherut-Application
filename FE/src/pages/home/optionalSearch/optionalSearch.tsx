import useStyle from "./optionalSearch.css";
import {IGroup} from "../../../types/homepageType";
import Group from "./group/group"
import axios from "axios";
import {useEffect, useRef, useState} from "react";
import logger from "../../../services/logger/logger";
import useElementWidth from "../../../hooks/useElementWidth";

const OptionalSearch = () => {
    const [optionalSearchValues, setOptionalSearchValues] = useState<Array<IGroup>>([]);
    const rootRef = useRef<HTMLDivElement>(null);
    const widthOfRoot = useElementWidth(rootRef);
    const itemsInRow = widthOfRoot / 350;
    const heightPerItem = 210;
    const minHeight = Math.ceil(optionalSearchValues.length / itemsInRow) * heightPerItem;
    const classes = useStyle({minHeight});
    useEffect(() => {
            const getOptionalSearchValues = async () => {
                try {
                    const response = await axios.get(`/configs/homepage.json?cacheBuster=${Date.now()}`);
                    setOptionalSearchValues(response.data);
                } catch (error) {
                    logger.error({message:"Error fetching optional search values:",payload:error});
                }
            }
            getOptionalSearchValues();
        }, []
    )
    return (
        <div ref={rootRef} className={classes.root}>
            {Object.values(optionalSearchValues).map((group: IGroup, index: number) => (
                <Group key={index} group={group}/>
            ))}
        </div>
    );
};

export default OptionalSearch;

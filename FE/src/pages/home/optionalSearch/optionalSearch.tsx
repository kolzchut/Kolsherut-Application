import useStyle from "./optionalSearch.css";
import {IGroup} from "../../../types/homepageType";
import Group from "./group/group"
import axios from "axios";
import {useEffect, useState} from "react";
import logger from "../../../services/logger/logger.ts";

const OptionalSearch = () => {
    const classes = useStyle();
    const [optionalSearchValues, setOptionalSearchValues] = useState<Array<IGroup>>([]);
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
        <div className={classes.root}>
            {Object.values(optionalSearchValues).map((group: IGroup, index: number) => (
                <Group key={index} group={group}/>
            ))}
        </div>
    );
};

export default OptionalSearch;

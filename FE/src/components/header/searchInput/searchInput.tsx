import inactiveSearchIcon from "../../../assets/icon-search-blue-1.svg";
import activeSearchIcon from "../../../assets/icon-search-blue-0.svg";
import {ChangeEvent, useRef, useState} from "react";
import AutocompleteType from "../../../types/autocompleteType.ts";
import sendMessage from "../../../services/sendMessage/sendMessage.ts";
import SearchOption from "../../../pages/home/search/searchInput/searchOption/searchOption.tsx";
import useStyles from "./searchInput.css"
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../constants/mediaQueryProps.ts";

const inputDescription = "Search for services, organizations, branches, and more"

const SearchInput = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({isMobile});
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [optionalSearchValues, setOptionalSearchValues] = useState<AutocompleteType[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const timeoutId = useRef<number | null>(null);
    const inputChangeEvent = (v: ChangeEvent<HTMLInputElement>) => {
        const value: string = v.target.value;
        setSearchTerm(value);

        if (timeoutId.current !== null) clearTimeout(timeoutId.current);

        timeoutId.current = window.setTimeout(async () => {
            if (value === '') return setOptionalSearchValues([]);
            const requestURL = window.config.routes.autocomplete.replace('%%search%%', value);
            const response = await sendMessage({method: 'get', requestURL});
            setOptionalSearchValues(response.data);
        }, 1000);
    };

    const onCloseSearchOptions = () => setOptionalSearchValues([])

    return <div className={classes.root}>
        <div className={classes.inputDiv}>
            <img className={classes.searchIcon} alt={"search icon"}
                 src={isInputFocused ? activeSearchIcon : inactiveSearchIcon}/>
            <input
                id="search-input"
                ref={inputRef}
                className={classes.input}
                type={"text"}
                value={searchTerm}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={inputChangeEvent}
                aria-label={inputDescription}
            />
        </div>
        {optionalSearchValues.length > 0 && <div className={classes.searchOptionsDiv}>
            {optionalSearchValues.map((value: AutocompleteType, index: number) => (
                <SearchOption value={value} key={index} onCloseSearchOptions={onCloseSearchOptions}/>
            ))}
        </div>}
    </div>
}
export default SearchInput;

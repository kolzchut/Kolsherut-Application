import inactiveSearchIcon from "../../../assets/icon-search-blue-1.svg";
import activeSearchIcon from "../../../assets/icon-search-blue-0.svg";
import {ChangeEvent, useEffect, useRef, useState, KeyboardEvent} from "react";
import AutocompleteType from "../../../types/autocompleteType";
import sendMessage from "../../../services/sendMessage/sendMessage";
import SearchOption from "../../../pages/home/search/searchInput/searchOption/searchOption";
import useStyles from "./searchInput.css"
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../constants/mediaQueryProps";
import {onFocusOnSearchInput} from "../../../services/gtag/resultsEvents";
import {useDebounce} from "../../../hooks/useDebounce";
import useOnClickedOutside from "../../../hooks/useOnClickedOutside";
import {useSelector} from "react-redux";
import {getSearchQuery} from "../../../store/general/general.selector.ts";
import {settingToResults} from "../../../store/shared/sharedSlice.ts";

const inputDescription = "Search for services, organizations, branches, and more"

const SearchInput = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({isMobile});
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [optionalSearchValues, setOptionalSearchValues] = useState<AutocompleteType[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const {ref} = useOnClickedOutside(() => setOptionalSearchValues([]));
    const debouncedGetAutoComplete = useDebounce(async (value) => {
        if (value === '') return setOptionalSearchValues([]);
        const requestURL = window.config.routes.autocomplete.replace('%%search%%', value);
        const response = await sendMessage({method: 'get', requestURL});
        setOptionalSearchValues(response.data);
    }, 1000);
    const inputChangeEvent = (v: ChangeEvent<HTMLInputElement>) => {
        const value: string = v.target.value;
        setSearchTerm(value);
        debouncedGetAutoComplete(value);
    };
    const onInputFocus = () => {
        setIsInputFocused(true);
        onFocusOnSearchInput();
    }
    const onCloseSearchOptions = () => setOptionalSearchValues([]);
    const searchQuery = useSelector(getSearchQuery);

    useEffect(() => {
        if (!searchQuery) return;
        setSearchTerm(searchQuery);
    }, [searchQuery]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            settingToResults({value:{title:searchTerm}})
            onCloseSearchOptions()
        }
    };

    return <div className={classes.root} ref={ref}>
        <div className={classes.inputDiv}>
            <img className={classes.searchIcon} alt={"search icon"}
                 src={isInputFocused ? activeSearchIcon : inactiveSearchIcon}/>
            <input
                id="search-input"
                ref={inputRef}
                className={classes.input}
                type={"text"}
                value={searchTerm}
                onFocus={onInputFocus}
                onChange={inputChangeEvent}
                onKeyDown={handleKeyDown}
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

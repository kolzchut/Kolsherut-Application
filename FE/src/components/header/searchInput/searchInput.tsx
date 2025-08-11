import inactiveSearchIcon from "../../../assets/icon-search-blue-1.svg";
import activeSearchIcon from "../../../assets/icon-search-blue-0.svg";
import {ChangeEvent, useEffect, useRef, useState, KeyboardEvent} from "react";
import AutocompleteType, {IStructureAutocomplete} from "../../../types/autocompleteType";
import sendMessage from "../../../services/sendMessage/sendMessage";
import SearchOption from "../../../pages/home/search/searchInput/searchOption/searchOption";
import resultsAnalytics from "../../../services/gtag/resultsEvents";
import {useDebounce} from "../../../hooks/useDebounce";
import useOnClickedOutside from "../../../hooks/useOnClickedOutside";
import {useSelector} from "react-redux";
import {getPage, getSearchQuery} from "../../../store/general/general.selector";
import {settingToResults} from "../../../store/shared/sharedSlice";
import generalAnalytics from "../../../services/gtag/generalEvents";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../types/dynamicThemeApp.ts";
import useStyles from "./searchInput.css.ts";
import InputPlaceHolder from "./inputPlaceHolder/inputPlaceHolder.tsx";

const inputDescription = "Search for services, organizations, branches, and more"
const emptyAutocomplete: AutocompleteType = {structured: [], unstructured: []};

const SearchInput = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({theme});
    const searchQuery = useSelector(getSearchQuery);
    const page = useSelector(getPage);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [optionalSearchValues, setOptionalSearchValues] = useState<AutocompleteType>(emptyAutocomplete);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const {ref} = useOnClickedOutside(() => setOptionalSearchValues(emptyAutocomplete));
    const debouncedGetAutoComplete = useDebounce(async (value) => {
        if (value === '') return setOptionalSearchValues(emptyAutocomplete);
        const requestURL = window.config.routes.autocomplete.replace('%%search%%', value);
        const response = await sendMessage({method: 'get', requestURL});
        setOptionalSearchValues(response.data);
    }, 1000);
    const inputChangeEvent = (v: ChangeEvent<HTMLInputElement>) => {
        const value: string = v.target.value;
        setSearchTerm(value);
        debouncedGetAutoComplete(value);
    };
    const onCloseSearchOptions = () => setOptionalSearchValues(emptyAutocomplete);

    useEffect(() => {
        if (!searchQuery) return;
        setSearchTerm(searchQuery);
    }, [searchQuery]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            settingToResults({value: {query: searchTerm}, removeOldFilters: true})
            onCloseSearchOptions()
        }
    };
    const onInputBlur = () => {
        setIsInputFocused(false);
        setSearchTerm(searchQuery)
    }
    const onClickPlaceHolder = () => {
        setIsInputFocused(true);
        generalAnalytics.internalSearchClickedEvent({query: searchQuery, where: page});
        resultsAnalytics.onFocusOnSearchInput();
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 0)

    }
    const inputValue = searchTerm.replace(/_/g, ' ')
    return <div className={classes.mainInputDiv} ref={ref}>
        {!isInputFocused && <InputPlaceHolder onClick={onClickPlaceHolder}/>}
        {isInputFocused && <div className={classes.inputDiv}>
            <img className={classes.searchIcon} alt={"search icon"}
                 src={isInputFocused ? activeSearchIcon : inactiveSearchIcon}/>
            <input
                id="search-input"
                ref={inputRef}
                className={classes.input}
                type={"text"}
                value={inputValue}
                onBlur={onInputBlur}
                onChange={inputChangeEvent}
                onKeyDown={handleKeyDown}
                aria-label={inputDescription}
            />
        </div>
        } {optionalSearchValues.structured.length > 0 && <div className={classes.searchOptionsDiv}>
        {optionalSearchValues.structured.map((value: IStructureAutocomplete, index: number) => (
            <SearchOption value={value} isStructured={true} key={index}
                          onCloseSearchOptions={onCloseSearchOptions}/>
        ))}
        {optionalSearchValues.unstructured.map((value, index) => (
            <SearchOption value={value} isStructured={false} key={index}
                          onCloseSearchOptions={onCloseSearchOptions}/>
        ))}
    </div>}
    </div>
}
export default SearchInput;

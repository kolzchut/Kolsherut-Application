import inactiveSearchIcon from "../../../assets/icon-search-blue-1.svg";
import activeSearchIcon from "../../../assets/icon-search-blue-0.svg";
import {useEffect, useRef, useState, KeyboardEvent} from "react";
import AutocompleteType, {IStructureAutocomplete} from "../../../types/autocompleteType";
import SearchOption from "../../../pages/home/search/searchInput/searchOption/searchOption";
import resultsAnalytics from "../../../services/gtag/resultsEvents";
import useOnClickedOutside from "../../../hooks/useOnClickedOutside";
import {useSelector} from "react-redux";
import {getPage, getSearchQuery} from "../../../store/general/general.selector";
import {changingPageToResults} from "../../../store/shared/sharedSlice";
import generalAnalytics from "../../../services/gtag/generalEvents";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../types/dynamicThemeApp.ts";
import useStyles from "./searchInput.css.ts";
import InputPlaceHolder from "./inputPlaceHolder/inputPlaceHolder.tsx";
import useSearchAutocomplete from "../../../hooks/useSearchAutocomplete";

const inputDescription = "Search for services, organizations, branches, and more"
const emptyAutocomplete: AutocompleteType = {structured: [], unstructured: []};

const SearchInput = ({refreshPage}:{refreshPage?: ()=>void}) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({theme});
    const searchQuery = useSelector(getSearchQuery);
    const page = useSelector(getPage);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [optionalSearchValues, setOptionalSearchValues] = useState<AutocompleteType>(emptyAutocomplete);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const {ref} = useOnClickedOutside(() => setOptionalSearchValues(emptyAutocomplete));

    const { inputChangeEvent } = useSearchAutocomplete({ setSearchTerm, setOptionalSearchValues });

    useEffect(() => {
        if (!searchQuery) return;
        setSearchTerm(searchQuery);
    }, [searchQuery]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            changingPageToResults({value: {query: searchTerm}, removeOldFilters: true})
            onCloseSearchOptions()
        }
    };
    const onCloseSearchOptions = () => setOptionalSearchValues(emptyAutocomplete);

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
                type="text"
                value={inputValue}
                onBlur={onInputBlur}
                onChange={inputChangeEvent}
                onKeyDown={handleKeyDown}
                aria-label={inputDescription}
                autoComplete="off"
            />
        </div>}
        {(optionalSearchValues.structured.length > 0 || optionalSearchValues.unstructured.length> 0) && <div className={classes.searchOptionsDiv}>
        {optionalSearchValues.structured.map((value: IStructureAutocomplete, index: number) => (
            <SearchOption value={value} isStructured={true} key={index}
                          onCloseSearchOptions={onCloseSearchOptions} refreshPage={refreshPage}/>
        ))}
        {optionalSearchValues.unstructured.map((value, index) => (
            <SearchOption value={value} isStructured={false} key={index}
                          onCloseSearchOptions={onCloseSearchOptions} refreshPage={refreshPage}/>
        ))}
    </div>}
    </div>
}
export default SearchInput;

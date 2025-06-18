import useStyle from './search.css';
import lightIconSearch from '../../../assets/icon-search-blue-1.svg'
import IconArrowTopRight from '../../../assets/icon-arrow-top-right-gray-4.svg';
import {ChangeEvent, useState} from "react";
import sendMessage from "../../../services/sendMessage/sendMessage";
import AutocompleteType from "../../../types/autocompleteType";

const Search = () => {
    const classes = useStyle();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [optionalSearchValues, setOptionalSearchValues] = useState<AutocompleteType[]>([]);
    const inputChangeEvent = async(v: ChangeEvent<HTMLInputElement>,) => {
        const value: string = v.target.value;
        setSearchTerm(value)
        if(value === '') return setOptionalSearchValues([]);
        const requestURL = window.config.routes.autocomplete.replace(':search', value)
        const response = await sendMessage({method:'get', requestURL})
        setOptionalSearchValues(response.data)
    }
    return (
        <section className={classes.root}>
            <h2>{searchTerm}</h2>
            <div className={classes.searchContainer}>
                <img className={classes.searchButton} alt={"חיפוש"} src={lightIconSearch}/>
                <input
                    value={searchTerm}
                    onChange={inputChangeEvent}
                    className={classes.searchInput}
                    placeholder={window.strings.search.label}
                />

            </div>
            <div className={classes.optionalSearchValuesWrapper}>
                {optionalSearchValues.map((value: AutocompleteType, index:number) => (
                    <div key={index} onClick={() => setSearchTerm(value.structured_query)} className={classes.optionalSearchValue}>
                        <span className={classes.iconAndText}>
                            <img className={classes.searchIcon} alt={"חיפוש"} src={lightIconSearch}/>
                            <span key={index} >{value.query}</span>
                        </span>
                        <img className={classes.searchIcon} alt={"חיפוש"} src={IconArrowTopRight}/>

                    </div>
                ))}
            </div>
        </section>
    );
};

export default Search;
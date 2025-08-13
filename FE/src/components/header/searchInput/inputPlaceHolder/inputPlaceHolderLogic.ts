export const checkIfLocationKeyEqualsToWord = ({locationKey, word}: { locationKey: string, word: string }): boolean => {
    const castedLocation = "ב" + locationKey;
    return castedLocation === word;
}

interface IParseSearchQueryToSentences {
    searchQueryArray: string[];
    forSeparators: string[];
    bySeparators: string[];
}

export interface IPlaceHolderText {
    responseSentence?: string;
    situationSentence?: string;
    bySentence?: string;
}

export const parseSearchQueryToSentences = ({searchQueryArray, forSeparators, bySeparators}
                                            : IParseSearchQueryToSentences): IPlaceHolderText => {
    const indexOfForSeparator = searchQueryArray.findIndex((word) => forSeparators.includes(word));
    const indexOfBySeparator = searchQueryArray.findIndex((word) => bySeparators.includes(word));

    const text: IPlaceHolderText = {};

    if (indexOfForSeparator !== -1 && indexOfBySeparator !== -1) {
        if (indexOfForSeparator < indexOfBySeparator) {
            text.responseSentence = searchQueryArray.slice(0, indexOfForSeparator).join(' ');
            text.situationSentence = searchQueryArray.slice(indexOfForSeparator, indexOfBySeparator).join(' ');
            text.bySentence = searchQueryArray.slice(indexOfBySeparator).join(' ');
        } else {
            text.responseSentence = searchQueryArray.slice(0, indexOfBySeparator).join(' ');
            text.bySentence = searchQueryArray.slice(indexOfBySeparator, indexOfForSeparator).join(' ');
            text.situationSentence = searchQueryArray.slice(indexOfForSeparator).join(' ');
        }
    } else if (indexOfForSeparator !== -1) {
        text.responseSentence = searchQueryArray.slice(0, indexOfForSeparator).join(' ');
        text.situationSentence = searchQueryArray.slice(indexOfForSeparator).join(' ');
    } else if (indexOfBySeparator !== -1) {
        text.responseSentence = searchQueryArray.slice(0, indexOfBySeparator).join(' ');
        text.bySentence = searchQueryArray.slice(indexOfBySeparator).join(' ');
    } else
        text.responseSentence = searchQueryArray.join(' ');

    if(!text.situationSentence && !text.bySentence)
        return text;

    if (!text.responseSentence || text.responseSentence.trim() === '')
        text.responseSentence = window.strings.searchQueryTextDefaults.serviceSentence;

    if (!text.situationSentence || text.situationSentence.trim() === '')
        text.situationSentence = window.strings.searchQueryTextDefaults.forSentence;

    return text;
}

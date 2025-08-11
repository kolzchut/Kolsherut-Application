export const checkIfLocationKeyEqualsToWord = ({locationKey, word}: { locationKey: string, word: string }): boolean => {
    const castedLocation = "ב" + locationKey;
    return castedLocation === word;
}

interface IParseSearchQueryToSentences {
    searchQueryArray: string[];
    forSeparators: string[];
    bySeparators: string[];
}

interface IPlaceHolderText {
    serviceSentence?: string;
    forSentence?: string;
    bySentence?: string;
}

export const parseSearchQueryToSentences = ({searchQueryArray, forSeparators, bySeparators}
                                            : IParseSearchQueryToSentences): IPlaceHolderText => {
    const indexOfForSeparator = searchQueryArray.findIndex((word) => forSeparators.includes(word));
    const indexOfBySeparator = searchQueryArray.findIndex((word) => bySeparators.includes(word));

    const text: IPlaceHolderText = {};

    if (indexOfForSeparator !== -1 && indexOfBySeparator !== -1) {
        if (indexOfForSeparator < indexOfBySeparator) {
            text.serviceSentence = searchQueryArray.slice(0, indexOfForSeparator).join(' ');
            text.forSentence = searchQueryArray.slice(indexOfForSeparator, indexOfBySeparator).join(' ');
            text.bySentence = searchQueryArray.slice(indexOfBySeparator).join(' ');
        } else {
            text.serviceSentence = searchQueryArray.slice(0, indexOfBySeparator).join(' ');
            text.bySentence = searchQueryArray.slice(indexOfBySeparator, indexOfForSeparator).join(' ');
            text.forSentence = searchQueryArray.slice(indexOfForSeparator).join(' ');
        }
    } else if (indexOfForSeparator !== -1) {
        text.serviceSentence = searchQueryArray.slice(0, indexOfForSeparator).join(' ');
        text.forSentence = searchQueryArray.slice(indexOfForSeparator).join(' ');
    } else if (indexOfBySeparator !== -1) {
        text.serviceSentence = searchQueryArray.slice(0, indexOfBySeparator).join(' ');
        text.bySentence = searchQueryArray.slice(indexOfBySeparator).join(' ');
    } else
        text.serviceSentence = searchQueryArray.join(' ');

    if (!text.serviceSentence || text.serviceSentence.trim() === '')
        text.serviceSentence = window.strings.searchQueryTextDefaults.serviceSentence;

    if (!text.forSentence || text.forSentence.trim() === '')
        text.forSentence = window.strings.searchQueryTextDefaults.forSentence;

    return text;
}

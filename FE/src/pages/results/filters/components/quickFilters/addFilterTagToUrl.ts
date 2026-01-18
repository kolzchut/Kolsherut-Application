import logger from "../../../../../services/logger/logger";

interface IAddFilterTagToUrl {
    url: string;
    newValue: string;
    isResponse: boolean;
}

const addFilterTagToUrl = ({url, newValue, isResponse}: IAddFilterTagToUrl): string => {
    const key = isResponse ? 'rf' : 'sf';
    const segmentIdentifier = `/${key}/`;

    const decodedUrl = decodeURIComponent(url);
    const splitIndex = decodedUrl.indexOf(segmentIdentifier);

    if (splitIndex === -1) {
        const newArray = [newValue];
        const encodedValue = encodeURIComponent(JSON.stringify(newArray));
        return `${url}${segmentIdentifier}${encodedValue}`;
    }

    const prefix = decodedUrl.substring(0, splitIndex + segmentIdentifier.length);
    const rest = decodedUrl.substring(splitIndex + segmentIdentifier.length);
    const nextSlashIndex = rest.indexOf('/');

    let valueStr = '';
    let suffix = '';

    if (nextSlashIndex !== -1) {
        valueStr = rest.substring(0, nextSlashIndex);
        suffix = rest.substring(nextSlashIndex);
    } else {
        valueStr = rest;
    }

    let currentArray: string[] = [];
    try {
        if (valueStr.trim().startsWith('[')) {
            currentArray = JSON.parse(valueStr);
        } else if (valueStr.trim().length > 0) {
            currentArray = [valueStr];
        }
    } catch (e) {
        logger.error({message:`Error parsing existing ${key} array, starting fresh.`, payload:e});
        currentArray = [];
    }

    if (!currentArray.includes(newValue)) {
        currentArray.push(newValue);
    }
    const encodedNewValue = encodeURIComponent(JSON.stringify(currentArray));

    return `${prefix}${encodedNewValue}${suffix}`;
}

export default addFilterTagToUrl;

export const stringifyLocation = (location: {key: string, bounds: number[]}) => {
    return `${location.key}|${location.bounds.join(',')}`;
};

export const parseLocation = (location: string) =>{
    const [key, boundsString] = location.split('|');
    const bounds = boundsString.split(',').map(Number);
    return ({key, bounds});
};


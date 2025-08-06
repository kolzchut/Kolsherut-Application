export const debounced = (cd: (...args: any[]) => void, delay: number) => {
    let timeOutId :number;
    return (...args: any[]) => {
        clearTimeout(timeOutId);
        timeOutId = setTimeout(() => {
            cd(...args);
        }, delay);
    }
}

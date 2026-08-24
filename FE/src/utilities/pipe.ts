export default <T>(val: T, ...fns: ((arg: T) => T)[]): T => {
    return fns.reduce((acc, fn) => fn(acc), val);
};

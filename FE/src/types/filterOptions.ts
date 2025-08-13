interface IFilterOptions {
    [key: string]: { count: string| number, name: string, type: 'response'|'situation' }
}
export default IFilterOptions;

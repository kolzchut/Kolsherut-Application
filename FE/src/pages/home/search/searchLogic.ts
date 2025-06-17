export const filterOptions = ({searchTerm,Options, setOptionalSearchValues}:{searchTerm: string, Options: string[], setOptionalSearchValues:  React.Dispatch<Array<string>>}) => {
    if (!searchTerm) return;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    setOptionalSearchValues(Options.filter(option => option.toLowerCase().includes(lowerCaseSearchTerm)));
}

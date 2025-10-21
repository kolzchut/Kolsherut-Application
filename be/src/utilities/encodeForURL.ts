const encodeForURL = (str: string): string => {
    return encodeURIComponent(str).replace(/%3A/g, ':').replace(/%20/g, '_');
}
export default encodeForURL;

export default interface SendMessageType{
    method: 'get' | 'post' | 'delete' | 'put' | 'patch',
    requestURL?: string,
    body?: unknown
}
import sendMessage from "../sendMessage/sendMessage";
import applicationIdentifierName from "../../constants/applicationIdentifierName";

export default (content: { message: string, payload?: unknown }) => {
    sendMessage({method: 'post', requestURL: `${window.config.routes.logs}/${applicationIdentifierName}`, body: content})
}

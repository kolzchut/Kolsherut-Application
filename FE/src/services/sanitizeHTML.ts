import DOMPurify from 'dompurify';

const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
    });
};
export default sanitizeHTML;

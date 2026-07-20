def build_context_text(documents: list[dict]) -> str:
    return '\n\n'.join(document.get('context_text') or document['text'] for document in documents)

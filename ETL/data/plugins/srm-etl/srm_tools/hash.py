import hashlib


def hasher(*args):
    str_args = [str(a) for a in args if a is not None and not (isinstance(a, float) and a != a)]
    return hashlib.sha1(''.join(str_args).encode('utf-8')).hexdigest()[:8]


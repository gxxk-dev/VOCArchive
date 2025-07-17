import hashlib

def file_hash(file_path: str, hash_method=hashlib.sha512) -> str:
    h = hash_method()
    with open(file_path, 'rb') as f:
        while b := f.read(8192):
            h.update(b)
    return h.hexdigest()

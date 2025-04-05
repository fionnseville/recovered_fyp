import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

hashed_pass = hash_password("123")
print(hashed_pass)  #used to check hashing was working correctly

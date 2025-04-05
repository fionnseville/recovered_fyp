def get_round_keys(words):
    round_keys = []
    for i in range(0, 60, 4):
        key_words = words[i:i+4]
        round_key = [[key_words[col][row] for col in range(4)] for row in range(4)]
        round_keys.append(round_key)
    return round_keys

# -- AES Block Encrypt (AES-256) --

def aes_encrypt_block(block, words):
    state = bytes_to_state(block)
    round_keys = get_round_keys(words)

    state = add_round_key(state, round_keys[0])

    for round in range(1, 14):
        state = sub_bytes(state)
        state = shift_rows(state)
        state = mix_columns(state)
        state = add_round_key(state, round_keys[round])

    state = sub_bytes(state)
    state = shift_rows(state)
    state = add_round_key(state, round_keys[14])

    return state_to_bytes(state)

# -- CBC Mode Encryption --

def aes_encrypt_cbc(plaintext_bytes, words, iv_bytes):
    plaintext_padded = pad_pkcs7(plaintext_bytes)
    blocks = split_blocks(plaintext_padded)

    ciphertext_blocks = []
    previous = iv_bytes

    for block in blocks:
        xor_input = xor_blocks(block, previous)
        encrypted = aes_encrypt_block(xor_input, words)
        ciphertext_blocks.append(encrypted)
        previous = encrypted

    return [byte for block in ciphertext_blocks for byte in block]
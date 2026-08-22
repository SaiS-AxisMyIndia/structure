<?php

declare(strict_types=1);

namespace Session;

/**
 * Turns a SessionToken into a signed, compact string and back — this
 * package's equivalent of a JWT encoder/decoder. Wire shape is always
 * `base64(header).base64(payload).base64(signature)`, HMAC-signed with the
 * configured secret so tampering is always caught regardless of `enc`.
 *
 * The payload itself carries id/created_at/expire_at/version plus either:
 *   - `data`: the plain payload array, when config `enc` is false (default), or
 *   - `key` + `enc`: the token's random 10-digit encKey (cleartext — it's a
 *     diversifier, not a secret) and `data`, AES-256-CBC encrypted with a
 *     key derived from secret+encKey, when `enc` is true.
 *
 * decode() returns null for a bad signature, malformed payload, OR a
 * decryption failure — SessionCodec treats "the enc blob didn't decrypt to
 * anything usable" exactly like "this token doesn't decode", so a caller
 * never has to special-case a corrupt/empty `enc` differently from any
 * other invalid token (main or refresh — decode() doesn't know which).
 */
final class SessionCodec
{
    public function __construct(private readonly SessionConfig $config)
    {
    }

    public function encode(SessionToken $token): ?string
    {
        $payload = [
            'id' => $token->id,
            'kind' => $token->kind,
            'created_at' => $token->createdAt,
            'expire_at' => $token->expireAt,
            'version' => $token->version,
        ];

        if ($this->config->enc) {
            // enc is on but this token was never given an encKey (e.g. it
            // was created before enc was turned on) — can't encrypt it
            // safely, so fail closed rather than silently sending it in
            // the clear.
            if ($token->encKey === null) {
                return null;
            }

            $encrypted = $this->encrypt($token->data, $token->encKey);

            if ($encrypted === null) {
                return null;
            }

            $payload['key'] = $token->encKey;
            $payload['enc'] = $encrypted;
        } else {
            $payload['data'] = $token->data;
        }

        $header = $this->base64UrlEncode(json_encode(['alg' => $this->config->enc ? 'HS256+ENC' : 'HS256']));
        $body = $this->base64UrlEncode(json_encode($payload));

        if ($header === '' || $body === '') {
            return null;
        }

        return "$header.$body." . $this->sign("$header.$body");
    }

    public function decode(string $compact): ?SessionToken
    {
        $parts = explode('.', $compact);

        if (count($parts) !== 3) {
            return null;
        }

        [$header, $body, $signature] = $parts;

        if (!hash_equals($this->sign("$header.$body"), $signature)) {
            return null; // tampered, or signed with a different secret
        }

        $payload = json_decode($this->base64UrlDecode($body), true);

        if (
            !is_array($payload)
            || !isset($payload['id'], $payload['created_at'], $payload['expire_at'], $payload['version'])
        ) {
            return null;
        }

        $encKey = null;

        if (array_key_exists('enc', $payload)) {
            if (!is_string($payload['enc']) || !isset($payload['key']) || !is_string($payload['key'])) {
                return null;
            }

            $encKey = $payload['key'];
            $data = $this->decrypt($payload['enc'], $encKey);

            if ($data === null) {
                return null; // couldn't decrypt — treated identically to "invalid token"
            }
        } else {
            $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];
        }

        return new SessionToken(
            id: (string) $payload['id'],
            createdAt: (int) $payload['created_at'],
            expireAt: (int) $payload['expire_at'],
            version: (int) $payload['version'],
            data: $data,
            encKey: $encKey,
            // Absent on a token encoded before `kind` existed — treat that
            // as 'access', same as this field's own constructor default.
            kind: is_string($payload['kind'] ?? null) ? $payload['kind'] : 'access',
        );
    }

    private function sign(string $value): string
    {
        return $this->base64UrlEncode(hash_hmac('sha256', $value, $this->config->secret, true));
    }

    /** @param array<string, mixed> $data */
    private function encrypt(array $data, string $encKey): ?string
    {
        $iv = random_bytes(16);
        $key = $this->deriveKey($encKey);
        $ciphertext = openssl_encrypt(json_encode($data), 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        if ($ciphertext === false) {
            return null;
        }

        return base64_encode($iv . $ciphertext);
    }

    /** @return array<string, mixed>|null */
    private function decrypt(string $encoded, string $encKey): ?array
    {
        $raw = base64_decode($encoded, true);

        if ($raw === false || strlen($raw) <= 16) {
            return null;
        }

        $iv = substr($raw, 0, 16);
        $ciphertext = substr($raw, 16);
        $key = $this->deriveKey($encKey);
        $plaintext = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        if ($plaintext === false || $plaintext === '') {
            return null;
        }

        $data = json_decode($plaintext, true);

        return is_array($data) ? $data : null;
    }

    /** Derives this one token's AES key from the app secret + its random per-token encKey. */
    private function deriveKey(string $encKey): string
    {
        return hash('sha256', $this->config->secret . $encKey, true);
    }

    private function base64UrlEncode(string|false $value): string
    {
        if ($value === false) {
            return '';
        }

        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/'), true) ?: '';
    }
}

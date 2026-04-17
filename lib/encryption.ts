import CryptoJS from 'crypto-js'

const getSecret = (): string => {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error(
      'ENCRYPTION_SECRET is not set. Add it to your .env.local file.'
    )
  }
  if (secret.length < 32) {
    throw new Error(
      'ENCRYPTION_SECRET must be at least 32 characters long.'
    )
  }
  return secret
}

export function encryptApiKey(plaintext: string): string {
  const secret = getSecret()
  return CryptoJS.AES.encrypt(plaintext, secret).toString()
}

export function decryptApiKey(ciphertext: string): string {
  const secret = getSecret()
  const bytes = CryptoJS.AES.decrypt(ciphertext, secret)
  const decrypted = bytes.toString(CryptoJS.enc.Utf8)
  if (!decrypted) {
    throw new Error(
      'Decryption failed. The key may be corrupted or the secret may have changed.'
    )
  }
  return decrypted
}

export function maskApiKey(plaintext: string): string {
  if (plaintext.length < 8) return '••••••••'
  return plaintext.slice(0, 4) + '••••••••' + plaintext.slice(-4)
}
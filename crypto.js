/**
 * crypto.js — Criptografia Ponta a Ponta (E2EE)
 * Usa Web Crypto API nativa do browser (sem bibliotecas externas)
 * Algoritmo: RSA-OAEP (2048 bits) + AES-GCM (256 bits)
 */
const SobralCrypto = (() => {
  const ALGO_RSA = { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
  const ALGO_AES = { name: 'AES-GCM', length: 256 };
  const bufToBase64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const base64ToBuf = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  async function generateKeyPair() {
    if (!crypto.subtle) {
      throw new Error('SubtleCrypto não disponível. Certifique-se de estar usando HTTPS ou localhost.');
    }
    const kp = await crypto.subtle.generateKey(ALGO_RSA, true, ['encrypt', 'decrypt']);
    return { publicKey: bufToBase64(await crypto.subtle.exportKey('spki', kp.publicKey)), privateKey: bufToBase64(await crypto.subtle.exportKey('pkcs8', kp.privateKey)) };
  }
  async function importPublicKey(b64) { return crypto.subtle.importKey('spki', base64ToBuf(b64), ALGO_RSA, false, ['encrypt']); }
  async function importPrivateKey(b64) { return crypto.subtle.importKey('pkcs8', base64ToBuf(b64), ALGO_RSA, false, ['decrypt']); }
  async function encrypt(plainText, recipientPublicKeyB64) {
    const aesKey = await crypto.subtle.generateKey(ALGO_AES, true, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedText = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(plainText));
    const aesExported = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, await importPublicKey(recipientPublicKeyB64), aesExported);
    return { encryptedKey: bufToBase64(encryptedKey), iv: bufToBase64(iv), encryptedText: bufToBase64(encryptedText) };
  }
  async function decrypt(payload, privateKeyB64) {
    try {
      const aesRaw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, await importPrivateKey(privateKeyB64), base64ToBuf(payload.encryptedKey));
      const aesKey = await crypto.subtle.importKey('raw', aesRaw, ALGO_AES, false, ['decrypt']);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBuf(payload.iv) }, aesKey, base64ToBuf(payload.encryptedText));
      return new TextDecoder().decode(decrypted);
    } catch(e) { console.warn('Erro ao decriptografar:', e); return '[mensagem não pode ser lida]'; }
  }
  const savePrivateKey = (uid, k) => localStorage.setItem(`sc_priv_${uid}`, k);
  const loadPrivateKey = uid => localStorage.getItem(`sc_priv_${uid}`);
  const hasKeys = uid => !!localStorage.getItem(`sc_priv_${uid}`);
  const serializePayload = p => JSON.stringify(p);
  function deserializePayload(text) { try { const p = JSON.parse(text); return (p.encryptedKey && p.iv && p.encryptedText) ? p : null; } catch { return null; } }
  return { generateKeyPair, encrypt, decrypt, savePrivateKey, loadPrivateKey, hasKeys, serializePayload, deserializePayload };
})();

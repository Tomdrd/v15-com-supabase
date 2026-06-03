/**
 * crypto.js — Criptografia Ponta a Ponta (E2EE)
 * Usa Web Crypto API nativa do browser (sem bibliotecas externas)
 *
 * Algoritmos:
 *   - Mensagens:  RSA-OAEP (2048) + AES-GCM (256)
 *   - Chave mestra: PBKDF2 → AES-GCM (wrap/unwrap da chave privada RSA)
 */
const SobralCrypto = (() => {
  const ALGO_RSA  = { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' };
  const ALGO_AES  = { name: 'AES-GCM', length: 256 };
  const ALGO_PBKDF = 'PBKDF2';
  const PBKDF_ITERS = 200_000;

  const bufToB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const b64ToBuf = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  // ── Par de chaves RSA ────────────────────────────────────────────
  async function generateKeyPair() {
    if (!crypto?.subtle) throw new Error('SubtleCrypto indisponível (requer HTTPS)');
    const kp = await crypto.subtle.generateKey(ALGO_RSA, true, ['encrypt','decrypt']);
    return {
      publicKey:  bufToB64(await crypto.subtle.exportKey('spki',  kp.publicKey)),
      privateKey: bufToB64(await crypto.subtle.exportKey('pkcs8', kp.privateKey)),
    };
  }

  async function importPublicKey(b64) {
    return crypto.subtle.importKey('spki', b64ToBuf(b64), ALGO_RSA, false, ['encrypt']);
  }
  async function importPrivateKey(b64) {
    return crypto.subtle.importKey('pkcs8', b64ToBuf(b64), ALGO_RSA, false, ['decrypt']);
  }

  // ── Criptografia de mensagem ─────────────────────────────────────
  async function encrypt(plainText, recipientPublicKeyB64) {
    const aesKey = await crypto.subtle.generateKey(ALGO_AES, true, ['encrypt','decrypt']);
    const iv     = crypto.getRandomValues(new Uint8Array(12));
    const encryptedText = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(plainText)
    );
    const aesRaw      = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' }, await importPublicKey(recipientPublicKeyB64), aesRaw
    );
    return {
      encryptedKey:  bufToB64(encryptedKey),
      iv:            bufToB64(iv),
      encryptedText: bufToB64(encryptedText),
    };
  }

  async function decrypt(payload, privateKeyB64) {
    try {
      const aesRaw = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' }, await importPrivateKey(privateKeyB64), b64ToBuf(payload.encryptedKey)
      );
      const aesKey   = await crypto.subtle.importKey('raw', aesRaw, ALGO_AES, false, ['decrypt']);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64ToBuf(payload.iv) }, aesKey, b64ToBuf(payload.encryptedText)
      );
      return new TextDecoder().decode(decrypted);
    } catch(e) {
      console.warn('[E2EE] Erro ao decriptografar mensagem:', e);
      return null;
    }
  }

  // ── Chave mestra (wrap/unwrap da chave privada RSA via senha) ────
  /**
   * Deriva uma chave AES-GCM a partir de uma senha + salt via PBKDF2.
   * Nunca armazena nem transmite a senha.
   */
  async function _deriveWrappingKey(password, salt) {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey(
      'raw', enc.encode(password), { name: ALGO_PBKDF }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: ALGO_PBKDF, salt, iterations: PBKDF_ITERS, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Cifra a chave privada RSA com a senha do usuário.
   * Retorna um blob JSON base64 pronto pra salvar no banco.
   */
  async function wrapPrivateKey(privateKeyB64, password) {
    const salt      = crypto.getRandomValues(new Uint8Array(16));
    const iv        = crypto.getRandomValues(new Uint8Array(12));
    const wrapping  = await _deriveWrappingKey(password, salt);
    const privBuf   = b64ToBuf(privateKeyB64);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapping, privBuf);
    return JSON.stringify({
      v:    1,
      salt: bufToB64(salt),
      iv:   bufToB64(iv),
      data: bufToB64(encrypted),
    });
  }

  /**
   * Decifra o blob e devolve a chave privada RSA em base64.
   * Lança erro se a senha estiver errada.
   */
  async function unwrapPrivateKey(blobJson, password) {
    const { salt, iv, data } = JSON.parse(blobJson);
    const wrapping  = await _deriveWrappingKey(password, b64ToBuf(salt));
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64ToBuf(iv) }, wrapping, b64ToBuf(data)
      );
      return bufToB64(decrypted);
    } catch {
      throw new Error('Senha incorreta');
    }
  }

  // ── localStorage ────────────────────────────────────────────────
  const savePrivateKey  = (uid, k) => localStorage.setItem(`sc_priv_${uid}`, k);
  const loadPrivateKey  = uid      => localStorage.getItem(`sc_priv_${uid}`);
  const clearPrivateKey = uid      => localStorage.removeItem(`sc_priv_${uid}`);
  const hasKeys         = uid      => !!localStorage.getItem(`sc_priv_${uid}`);

  // ── Serialização de payload de mensagem ─────────────────────────
  const serializePayload   = p => JSON.stringify(p);
  function deserializePayload(text) {
    try {
      const p = JSON.parse(text);
      return (p?.encryptedKey && p?.iv && p?.encryptedText) ? p : null;
    } catch { return null; }
  }

  return {
    generateKeyPair,
    encrypt, decrypt,
    wrapPrivateKey, unwrapPrivateKey,
    savePrivateKey, loadPrivateKey, clearPrivateKey, hasKeys,
    serializePayload, deserializePayload,
  };
})();
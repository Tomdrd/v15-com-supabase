#!/usr/bin/env python3
BASE = '/home/tom/sobralcultural/v15-com-supabase'
with open(f'{BASE}/sobral_chat.html', 'r') as f: html = f.read()
if 'crypto.js' not in html:
    html = html.replace('<script src="sobral_chat.js" defer></script>', '<script src="crypto.js" defer></script>\n<script src="sobral_chat.js" defer></script>')
    with open(f'{BASE}/sobral_chat.html', 'w') as f: f.write(html)
    print('✓ sobral_chat.html — crypto.js adicionado')
else: print('~ sobral_chat.html — já presente')
with open(f'{BASE}/sobral_chat.js', 'r') as f: js = f.read()
changes = 0
def rep(old, new, label):
    global js, changes
    if old in js: js = js.replace(old, new); print(f'✓ {label}'); changes += 1
    else: print(f'! {label} — trecho não encontrado')
rep(".select('id, full_name, avatar_url, bio, lat, lng, location_updated_at')", ".select('id, full_name, avatar_url, bio, lat, lng, location_updated_at, public_key')", 'public_key no select')
rep('  // 1. Tenta usar a última localização salva no banco se for recente (menos de LOC_TTL_MIN min)', "  // Garante par de chaves E2EE\n  if (typeof SobralCrypto !== 'undefined' && !SobralCrypto.hasKeys(USER.id)) {\n    const keys = await SobralCrypto.generateKeyPair();\n    SobralCrypto.savePrivateKey(USER.id, keys.privateKey);\n    await supa.from('profiles').update({ public_key: keys.publicKey }).eq('id', USER.id);\n  }\n\n  // 1. Tenta usar a última localização salva no banco se for recente (menos de LOC_TTL_MIN min)", 'geração de chaves no init')
rep("  const { data, error } = await supa\n    .from('chat_messages')\n    .insert({\n      conversation_id: ACTIVE_CONV.id,\n      sender_id: USER.id,\n      text\n    })", "  let textToSend = text;\n  if (typeof SobralCrypto !== 'undefined' && ACTIVE_USER?.public_key) {\n    const payload = await SobralCrypto.encrypt(text, ACTIVE_USER.public_key);\n    textToSend = SobralCrypto.serializePayload(payload);\n  }\n  const { data, error } = await supa\n    .from('chat_messages')\n    .insert({\n      conversation_id: ACTIVE_CONV.id,\n      sender_id: USER.id,\n      text: textToSend\n    })", 'criptografia no sendMessage')
rep('last_message_text: text.substring(0, 80)', "last_message_text: '[mensagem criptografada]'", 'last_message_text anonimizado')
rep("  MESSAGES = data || [];\n  renderMessages();", "  MESSAGES = data || [];\n  const privKey = typeof SobralCrypto !== 'undefined' ? SobralCrypto.loadPrivateKey(USER.id) : null;\n  if (privKey) {\n    for (const msg of MESSAGES) {\n      const encPayload = SobralCrypto.deserializePayload(msg.text);\n      if (encPayload) msg.text = await SobralCrypto.decrypt(encPayload, privKey);\n    }\n  }\n  renderMessages();", 'decriptografia no loadMessages')
rep("    }, (payload) => {\n      const msg = payload.new;\n      // Se não for minha, adiciona à tela\n      if (msg.sender_id !== USER.id) {\n        MESSAGES.push(msg);\n        renderMessages();\n        markMessagesAsRead(); // Marca como lida assim que chega", "    }, async (payload) => {\n      const msg = payload.new;\n      if (msg.sender_id !== USER.id) {\n        const rtPrivKey = typeof SobralCrypto !== 'undefined' ? SobralCrypto.loadPrivateKey(USER.id) : null;\n        if (rtPrivKey) {\n          const encPayload = SobralCrypto.deserializePayload(msg.text);\n          if (encPayload) msg.text = await SobralCrypto.decrypt(encPayload, rtPrivKey);\n        }\n        MESSAGES.push(msg);\n        renderMessages();\n        markMessagesAsRead(); // Marca como lida assim que chega", 'decriptografia no Realtime')
with open(f'{BASE}/sobral_chat.js', 'w') as f: f.write(js)
print(f'\n✓ sobral_chat.js salvo — {changes}/6 alterações aplicadas')
print('\n─── PRÓXIMO PASSO: rode no Supabase SQL Editor ───')
print('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key TEXT;')

# ── Fix 1: Sender vê plaintext após enviar ───────────────────────
with open(f'{BASE}/sobral_chat.js', 'r') as f: js = f.read()

rep2_old = "  // Substitui temporário pelo real\n  MESSAGES = MESSAGES.filter(m => m.id !== tempMsg.id);\n  MESSAGES.push(data);"
rep2_new = "  // Substitui temporário pelo real, mantendo texto legível para o remetente\n  const idx = MESSAGES.findIndex(m => m.id === tempMsg.id);\n  if (idx !== -1) MESSAGES[idx] = { ...data, text };\n  else { MESSAGES = MESSAGES.filter(m => m.id !== tempMsg.id); MESSAGES.push({ ...data, text }); }"

if rep2_old in js:
    js = js.replace(rep2_old, rep2_new)
    print('✓ Fix 1 — remetente vê plaintext')
else:
    print('! Fix 1 — trecho não encontrado')

with open(f'{BASE}/sobral_chat.js', 'w') as f: f.write(js)

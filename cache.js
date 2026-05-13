window.CACHE = {
  get: function(key) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.data;
    } catch (e) {
      return null;
    }
  },
  set: function(key, data, ttlMs) {
    try {
      const item = {
        data: data,
        expiry: Date.now() + ttlMs
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error('CACHE.set failed', e);
    }
  },
  del: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('CACHE.del failed', e);
    }
  },
  clear: function() {
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sc_')) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }
};

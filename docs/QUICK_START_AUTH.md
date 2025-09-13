# Guide Rapide - Authentification Track

## 🚀 Utilisation

### 1. Connexion classique (1h)
```
📧 Email: user@example.com  
🔐 Password: ••••••••••
☐ Keep me signed in for 30 days

[Sign In]
```
→ **Résultat**: Déconnecté à la fermeture du navigateur

### 2. Connexion avec Remember Me (30 jours)  
```
📧 Email: user@example.com
🔐 Password: ••••••••••  
☑️ Keep me signed in for 30 days

[Sign In]
```
→ **Résultat**: Reste connecté même après fermeture

## 🔧 Configuration développeur

### Variables d'environnement essentielles

```bash
# Dans docker-compose.yml ou .env
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h              # Session courte  
JWT_REMEMBER_EXPIRES_IN=30d    # Remember Me
```

### Test rapide du système

```bash
# 1. Démarrer l'app
docker-compose up

# 2. Ouvrir http://localhost:5173
# 3. Créer un compte ou se connecter
# 4. Tester Remember Me avec DevTools

# Vérifier dans DevTools → Application:
# - Session courte: sessionStorage contient 'auth_token'
# - Remember Me: localStorage contient 'auth_token'
```

## 🛠️ API Usage

### Login avec Remember Me
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    remember_me: true  // ← Activer Remember Me
  })
});
```

### Vérifier le token
```javascript
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔍 Debugging

### Vérifier l'état d'auth
```javascript
// Dans la console navigateur
const authStore = window.__ZUSTAND_AUTH_STORE__;
console.log('Auth state:', authStore.getState());

// Ou vérifier manuellement
const token = sessionStorage.getItem('auth_token') || 
              localStorage.getItem('auth_token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token info:', {
    expires: new Date(payload.exp * 1000),
    rememberMe: payload.remember_me,
    userId: payload.userId
  });
}
```

### Logs utiles
```javascript
// Activer les logs détaillés (dans authStore.js)
console.log('Token stored in:', 
  sessionStorage.getItem('auth_token') ? 'session' : 'localStorage'
);
```

## 📋 Checklist de sécurité

- [ ] JWT_SECRET changé en production (256+ caractères)
- [ ] Durées de tokens appropriées (15min/7d en prod)
- [ ] HTTPS activé en production
- [ ] Logs de sécurité activés
- [ ] Backup des clés de chiffrement

## 🚨 Problèmes fréquents

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| Déconnecté au refresh | Token expiré | Vérifier `JWT_EXPIRES_IN` |
| Remember Me ne marche pas | `remember_me` pas envoyé | Vérifier checkbox frontend |
| "Invalid token" | JWT_SECRET différent | Synchroniser backend/env |
| Déconnecté trop vite | Durée trop courte | Ajuster `JWT_EXPIRES_IN` |

## 🎯 Prêt à utiliser

Le système Remember Me est maintenant opérationnel ! 
- Interface utilisateur ✅
- Backend sécurisé ✅  
- Stockage intelligent ✅
- Documentation complète ✅

**Next steps**: Tester les deux modes de connexion et ajuster les durées selon vos besoins.

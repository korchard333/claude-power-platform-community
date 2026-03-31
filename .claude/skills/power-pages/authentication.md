# Power Pages — Authentication

## Identity Providers

| Provider | Use Case |
|---|---|
| Microsoft Entra ID B2C | External users (customers, partners) — recommended |
| Microsoft Entra ID | Internal users via corporate SSO |
| Local Authentication | Username/password (built-in, simplest) |
| SAML 2.0 | Enterprise federation (Okta, PingFederate) |
| OAuth 2.0 | Social login (Google, Facebook, LinkedIn) |
| OpenID Connect | Standards-based SSO |

## Microsoft Entra ID B2C Setup (Recommended for External)

```
1. Create Microsoft Entra ID B2C tenant
2. Create App Registration for Power Pages
3. Configure user flows (sign-up, sign-in, password reset)
4. In Power Pages: Site Settings → Authentication → Add provider
5. Set: Authority, Client ID, Redirect URI, Metadata Address
```

## Contact = User

Every portal user maps to a Dataverse **Contact** record. Authentication creates or links a Contact. The contact's parent Account determines account-scoped table permissions.

## Authentication in Code Sites

Client-side auth is **UX-only** — Power Pages handles authentication via server-side session cookies. The SPA checks auth status for routing decisions, not for actual security.

```typescript
// src/services/authService.ts
export const authService = {
  login: () => { window.location.href = '/.auth/login/aad'; },
  logout: () => { window.location.href = '/.auth/logout'; },
  getRoles: async (): Promise<string[]> => {
    const res = await fetch('/_api/roles');
    const data = await res.json();
    return data.value?.map((r: any) => r.adx_name) ?? [];
  },
};
```

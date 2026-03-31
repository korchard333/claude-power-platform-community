# Testing — Code App Testing (React + TypeScript)

## Unit Tests (Vitest or Jest + React Testing Library)

**Vitest** is recommended for Code Apps (Vite projects) — it shares the Vite config, supports native ESM, and is faster than Jest. Jest works too but requires extra configuration for ESM/TypeScript.

```bash
# Install Vitest (recommended for Vite projects)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Or install Jest (if you prefer)
npm install -D jest @testing-library/react @testing-library/jest-dom ts-jest
```

### Vitest config (vite.config.ts)
```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

### Unit Tests (example with Vitest/Jest — syntax is identical)
```tsx
// src/hooks/__tests__/useContacts.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useContacts } from "../useContacts";

// Mock the generated service
jest.mock("../../generated/contactService", () => ({
  contactService: {
    getAll: jest.fn().mockResolvedValue([
      { contactid: "1", fullname: "Jane Smith", emailaddress1: "jane@test.com" },
    ]),
    delete: jest.fn().mockResolvedValue(undefined),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useContacts", () => {
  it("returns contacts after loading", async () => {
    const { result } = renderHook(() => useContacts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contacts).toHaveLength(1);
    expect(result.current.contacts[0].fullname).toBe("Jane Smith");
  });
});
```

---

## Component Tests
```tsx
// src/components/__tests__/ContactCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ContactCard } from "../ContactCard";

describe("ContactCard", () => {
  const mockContact = {
    id: "1",
    fullname: "Jane Smith",
    emailaddress1: "jane@test.com",
  };

  it("renders contact name", () => {
    render(
      <ContactCard contact={mockContact} onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("calls onEdit with correct id when edit clicked", () => {
    const onEdit = jest.fn();
    render(
      <ContactCard contact={mockContact} onEdit={onEdit} onDelete={jest.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith("1");
  });
});
```

---

## E2E Tests (Playwright)
```typescript
// e2e/contacts.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Contacts Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contacts");
  });

  test("displays contact list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /contacts/i })).toBeVisible();
    await expect(page.locator("[data-testid='contact-card']").first()).toBeVisible();
  });

  test("search filters results", async ({ page }) => {
    await page.getByPlaceholder("Search contacts").fill("Jane");
    await expect(page.locator("[data-testid='contact-card']")).toHaveCount(1);
  });
});
```

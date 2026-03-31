/**
 * ContactList — Presentation component for displaying contacts.
 *
 * ARCHITECTURAL RULES DEMONSTRATED:
 * 1. ZERO imports from generated/ or service layers
 * 2. ALL data received via props — no hooks that fetch data
 * 3. User actions flow UP via callback props (onDelete)
 * 4. Handles all render states: loading, error, empty, and data
 * 5. Semantic HTML and aria labels for accessibility (WCAG 2.2 AA)
 */

import type { Contact } from "../types/contact.types";

interface ContactListProps {
  /** Array of contacts to display */
  contacts: Contact[];
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Error from data fetching, if any */
  error: Error | null;
  /** Callback when user requests a contact deletion */
  onDelete: (contactId: string) => void;
  /** Whether a delete operation is in progress */
  isDeleting: boolean;
}

/**
 * Pure presentation component — renders a list of contacts.
 * Contains ZERO business logic. All data and actions come from props.
 */
export function ContactList({
  contacts,
  isLoading,
  error,
  onDelete,
  isDeleting,
}: ContactListProps) {
  // --- Loading state ---
  if (isLoading) {
    return (
      <div role="status" aria-label="Loading contacts">
        <p>Loading contacts...</p>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div role="alert" aria-label="Error loading contacts">
        <p>Failed to load contacts: {error.message}</p>
      </div>
    );
  }

  // --- Empty state ---
  if (contacts.length === 0) {
    return (
      <div aria-label="No contacts found">
        <p>No active contacts found.</p>
      </div>
    );
  }

  // --- Data state ---
  return (
    <section aria-label="Contact list">
      <table role="grid" aria-label="Contacts">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.contactid}>
              <td>{contact.fullname}</td>
              <td>{contact.emailaddress1 ?? "—"}</td>
              <td>{contact.telephone1 ?? "—"}</td>
              <td>
                <button
                  onClick={() => onDelete(contact.contactid)}
                  disabled={isDeleting}
                  aria-label={`Delete ${contact.fullname}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

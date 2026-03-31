/**
 * Contact entity types for Code Apps.
 *
 * ARCHITECTURAL RULE: Type definitions are shared across all layers.
 * Both hooks and components import from here — but components never
 * import from generated/ or hooks/.
 */

/** Contact record from Dataverse */
export interface Contact {
  /** Dataverse record ID (GUID) */
  contactid: string;
  /** Full name (computed column in Dataverse) */
  fullname: string;
  /** Primary email address */
  emailaddress1: string | null;
  /** Business phone */
  telephone1: string | null;
  /** Record status: 0 = Active, 1 = Inactive */
  statecode: number;
}

/** Shape returned by the useContacts hook */
export interface ContactListState {
  contacts: Contact[];
  isLoading: boolean;
  error: Error | null;
  deleteContact: (id: string) => void;
  isDeleting: boolean;
}

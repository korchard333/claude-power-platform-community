/**
 * useContacts — Business logic hook for Contact list operations.
 *
 * ARCHITECTURAL RULES DEMONSTRATED:
 * 1. This is the ONLY layer that imports from generated/ services
 * 2. All API calls are wrapped in TanStack Query (useQuery / useMutation)
 * 3. Exposes { data, isLoading, error } — components never see raw promises
 * 4. $select enforcement — never fetch all columns from Dataverse
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "../generated/contactService"; // Layer 3 (auto-generated)
import { toast } from "sonner";
import type { Contact, ContactListState } from "../types/contact.types";

const CONTACT_QUERY_KEY = ["contacts"] as const;

/**
 * Fetches active contacts with $select enforcement.
 * Returns loading/error states for the presentation layer.
 */
export function useContacts(): ContactListState {
  const queryClient = useQueryClient();

  // QUERY: Fetch active contacts with explicit $select
  // RULE: Always specify $select — never fetch all columns
  const {
    data: contacts = [],
    isLoading,
    error,
  } = useQuery<Contact[], Error>({
    queryKey: CONTACT_QUERY_KEY,
    queryFn: () =>
      contactService.getAll({
        select: ["contactid", "fullname", "emailaddress1", "telephone1", "statecode"],
        filter: "statecode eq 0", // Active records only
        orderBy: "fullname asc",
        top: 50,
      }),
  });

  // MUTATION: Delete a contact and invalidate the cache
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactService.delete(id),
    onSuccess: () => {
      // Invalidate triggers a background refetch — TanStack Query handles the rest
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEY });
      toast.success("Contact deleted");
    },
    onError: (err: Error) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });

  return {
    contacts,
    isLoading,
    error: error ?? null,
    deleteContact: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

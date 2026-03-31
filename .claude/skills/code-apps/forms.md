# Code Apps — Form Patterns

## Form Create/Edit Pattern

### Hook (Business Logic Layer)
```tsx
// src/hooks/useContactForm.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "../generated/contactService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ContactFormData {
  firstname: string;
  lastname: string;
  emailaddress1: string;
  telephone1?: string;
  "parentcustomerid@odata.bind"?: string; // Lookup bind syntax
}

export function useContactForm(contactId?: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEdit = !!contactId;

  // Load existing contact for edit mode
  const contactQuery = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () =>
      contactService.get(contactId!, {
        select: ["firstname", "lastname", "emailaddress1", "telephone1",
                 "_parentcustomerid_value"],
      }),
    enabled: isEdit,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (isEdit) {
        return contactService.update(contactId!, data);
      }
      return contactService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      toast.success(isEdit ? "Contact updated" : "Contact created");
      navigate("/contacts");
    },
    onError: (err: Error) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  return {
    contact: contactQuery.data ?? null,
    isLoading: contactQuery.isLoading,
    isSaving: saveMutation.isPending,
    error: contactQuery.error?.message ?? saveMutation.error?.message ?? null,
    save: saveMutation.mutateAsync,
  };
}
```

### Component (Presentation Layer)
```tsx
// src/components/ContactForm.tsx
import { useForm } from "react-hook-form"; // or native form state

interface ContactFormProps {
  defaultValues?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

export function ContactForm({ defaultValues, onSubmit, isSaving, error }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstname: defaultValues?.firstname ?? "",
    lastname: defaultValues?.lastname ?? "",
    emailaddress1: defaultValues?.emailaddress1 ?? "",
    telephone1: defaultValues?.telephone1 ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-4">
        <div>
          <Label htmlFor="firstname">First Name</Label>
          <Input
            id="firstname"
            value={formData.firstname}
            onChange={(e) => setFormData((d) => ({ ...d, firstname: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastname">Last Name</Label>
          <Input
            id="lastname"
            value={formData.lastname}
            onChange={(e) => setFormData((d) => ({ ...d, lastname: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.emailaddress1}
            onChange={(e) => setFormData((d) => ({ ...d, emailaddress1: e.target.value }))}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSaving} className="mt-4">
        {isSaving ? "Saving..." : "Save Contact"}
      </Button>
    </form>
  );
}
```

### Page (Composition)
```tsx
// src/pages/ContactEditPage.tsx
export function ContactEditPage() {
  const { id } = useParams<{ id: string }>();
  const { contact, isLoading, isSaving, error, save } = useContactForm(id);

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <main>
      <h1>{id ? "Edit Contact" : "New Contact"}</h1>
      <ContactForm
        defaultValues={contact ?? undefined}
        onSubmit={save}
        isSaving={isSaving}
        error={error}
      />
    </main>
  );
}
```

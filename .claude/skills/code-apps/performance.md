# Code Apps — Performance & Error Handling

## Error Handling Pattern

```tsx
// Level 1: Service (in hook)
const createMutation = useMutation({
  mutationFn: async (data: CreateInput) => {
    try {
      return await service.create(data);
    } catch (err) {
      throw new Error(`Failed to create record: ${(err as Error).message}`);
    }
  },
  onError: (err: Error) => toast.error(err.message),   // Level 2: Hook
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["records"] });
    toast.success("Record created");
  },
});

// Level 3: Component
function CreateForm({ onSubmit, error }: Props) {
  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert variant="destructive">{error}</Alert>}
      {/* form fields */}
    </form>
  );
}
```

---

## Performance Checklist

- [ ] All queries use `$select` (never fetch all columns)
- [ ] All list queries use `$top` for pagination
- [ ] Lookups resolved on-demand, not via `$expand` on large tables
- [ ] `React.memo` on components rendered inside lists
- [ ] TanStack Query `staleTime` configured appropriately
- [ ] Bundle size checked (no unnecessary dependencies)
- [ ] Images optimized and served from `public/`

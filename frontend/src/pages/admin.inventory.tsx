import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatusBadge, stockTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventory,
  updateInventory,
} from "@/services/api";
import {
  CATEGORY_LABELS,
  stockStatus,
  type AdminInventoryItem,
} from "@/utils/inventory";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [
  AdminInventoryItem["category"],
  string,
][];

function InventoryPage() {
  const [items, setItems] = useState<AdminInventoryItem[] | null>(null);
  const [editing, setEditing] = useState<AdminInventoryItem | null>(null);
  const [draft, setDraft] = useState({ stock: "0", threshold: "0" });
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState({
    name: "",
    category: "base" as AdminInventoryItem["category"],
    stock: "0",
    threshold: "20",
    price: "0",
  });
  const [adding, setAdding] = useState(false);

  const [deleting, setDeleting] = useState<AdminInventoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getInventory().then((res) => setItems(res.success ? res.data : []));
  }, []);

  const openEdit = (item: AdminInventoryItem) => {
    setEditing(item);
    setDraft({
      stock: String(item.stock),
      threshold: String(item.threshold),
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing) return;

    const stock = Math.max(0, Number(draft.stock) || 0);
    const threshold = Math.max(0, Number(draft.threshold) || 0);

    setSaving(true);

    const res = await updateInventory({ id: editing.id, stock, threshold });

    setSaving(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setItems((prev) =>
      prev ? prev.map((item) => (item.id === res.data.id ? res.data : item)) : prev
    );

    setEditing(null);
    toast.success(`${res.data.name} updated`);
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addDraft.name.trim().length < 2) {
      toast.error("Enter an item name");
      return;
    }

    setAdding(true);

    const res = await createInventoryItem({
      name: addDraft.name.trim(),
      category: addDraft.category,
      stock: Math.max(0, Number(addDraft.stock) || 0),
      lowStockThreshold: Math.max(0, Number(addDraft.threshold) || 0),
      price: Math.max(0, Number(addDraft.price) || 0),
    });

    setAdding(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setItems((prev) => (prev ? [...prev, res.data] : [res.data]));
    setAddOpen(false);
    setAddDraft({ name: "", category: "base", stock: "0", threshold: "20", price: "0" });
    toast.success(`${res.data.name} added`);
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    setDeleteLoading(true);

    const res = await deleteInventoryItem(deleting.id);

    setDeleteLoading(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setItems((prev) => (prev ? prev.filter((item) => item.id !== deleting.id) : prev));
    setDeleting(null);
    toast.success(`${deleting.name} deleted`);
  };

  return (
    <AdminLayout title="Inventory">
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {items === null ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="card-soft p-10 text-center text-muted-foreground">
          No inventory items yet. Add your first ingredient to get started.
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_OPTIONS.map(([category, label]) => {
            const rows = items.filter((item) => item.category === category);

            if (rows.length === 0) return null;

            return (
              <section key={category} className="card-soft overflow-hidden">
                <h2 className="p-5 text-lg font-bold">{label}</h2>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {rows.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-semibold">
                            {item.name}
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {label}
                          </TableCell>

                          <TableCell>{item.stock}</TableCell>
                          <TableCell>{item.threshold}</TableCell>
                          <TableCell>{item.price}</TableCell>

                          <TableCell>
                            <StatusBadge
                              label={stockStatus(item)}
                              tone={stockTone(stockStatus(item))}
                            />
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(item)}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleting(item)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ---- Edit dialog ---- */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>
              Update the inventory stock and threshold.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Item name</Label>
              <Input value={editing?.name ?? ""} readOnly />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={editing ? CATEGORY_LABELS[editing.category] : ""}
                readOnly
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  value={draft.stock}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, stock: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="threshold">Low-stock threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={0}
                  value={draft.threshold}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, threshold: e.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Add item dialog ---- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add inventory item</DialogTitle>
            <DialogDescription>
              Add a new ingredient customers can pick in the builder.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={addItem} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={addDraft.name}
                onChange={(e) =>
                  setAddDraft((d) => ({ ...d, name: e.target.value }))
                }
                placeholder="Mushroom"
                disabled={adding}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={addDraft.category}
                onValueChange={(value) =>
                  setAddDraft((d) => ({
                    ...d,
                    category: value as AdminInventoryItem["category"],
                  }))
                }
                disabled={adding}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-stock">Stock</Label>
                <Input
                  id="add-stock"
                  type="number"
                  min={0}
                  value={addDraft.stock}
                  onChange={(e) =>
                    setAddDraft((d) => ({ ...d, stock: e.target.value }))
                  }
                  disabled={adding}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-threshold">Threshold</Label>
                <Input
                  id="add-threshold"
                  type="number"
                  min={0}
                  value={addDraft.threshold}
                  onChange={(e) =>
                    setAddDraft((d) => ({ ...d, threshold: e.target.value }))
                  }
                  disabled={adding}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-price">Price</Label>
                <Input
                  id="add-price"
                  type="number"
                  min={0}
                  value={addDraft.price}
                  onChange={(e) =>
                    setAddDraft((d) => ({ ...d, price: e.target.value }))
                  }
                  disabled={adding}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={adding}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={adding}>
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {adding ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

            {/* ---- Delete confirmation ---- */}
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the ingredient from the builder entirely. Existing
              orders that used it keep their historical record. This can't be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

export default InventoryPage;
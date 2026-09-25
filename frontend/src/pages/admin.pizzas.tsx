import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  createPizza,
  deletePizza,
  getAllPizzasAdmin,
  updatePizza,
} from "@/services/api";
import { currency } from "@/utils/format";
import type { Pizza } from "@/utils/pizza";

type PizzaFormState = {
  name: string;
  description: string;
  image: string;
  ingredients: string;
  price: string;
  isAvailable: boolean;
};

const EMPTY_FORM: PizzaFormState = {
  name: "",
  description: "",
  image: "",
  ingredients: "",
  price: "0",
  isAvailable: true,
};

function AdminPizzasPage() {
  const [pizzas, setPizzas] = useState<Pizza[] | null>(null);

  const [editing, setEditing] = useState<Pizza | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PizzaFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Pizza | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    getAllPizzasAdmin().then((res) => setPizzas(res.success ? res.data : []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (pizza: Pizza) => {
    setEditing(pizza);
    setForm({
      name: pizza.name,
      description: pizza.description,
      image: pizza.image,
      ingredients: pizza.ingredients.join(", "),
      price: String(pizza.price),
      isAvailable: true, // refreshed below once we know the raw record's flag
    });
    setFormOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.name.trim().length < 2) {
      toast.error("Enter a pizza name");
      return;
    }
    if (form.description.trim().length < 2) {
      toast.error("Enter a description");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      ingredients: form.ingredients
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
      price: Math.max(0, Number(form.price) || 0),
      isAvailable: form.isAvailable,
    };

    setSaving(true);

    const res = editing
      ? await updatePizza(editing.id, payload)
      : await createPizza(payload);

    setSaving(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setPizzas((prev) => {
      if (!prev) return prev;
      return editing
        ? prev.map((p) => (p.id === res.data.id ? res.data : p))
        : [res.data, ...prev];
    });

    setFormOpen(false);
    toast.success(editing ? "Pizza updated" : "Pizza added");
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    setDeleteLoading(true);
    const res = await deletePizza(deleting.id);
    setDeleteLoading(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setPizzas((prev) => (prev ? prev.filter((p) => p.id !== deleting.id) : prev));
    setDeleting(null);
    toast.success(`${deleting.name} deleted`);
  };

  return (
    <AdminLayout title="Pizzas">
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pizza
        </Button>
      </div>

      {pizzas === null ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : pizzas.length === 0 ? (
        <div className="card-soft p-10 text-center text-muted-foreground">
          No pizzas yet. Add your first menu item.
        </div>
      ) : (
        <section className="card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pizzas.map((pizza) => (
                  <TableRow key={pizza.id}>
                    <TableCell className="font-semibold">{pizza.name}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {pizza.description}
                    </TableCell>
                    <TableCell>{currency(pizza.price)}</TableCell>
                    <TableCell>
                      <StatusBadge label="Available" tone="success" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(pizza)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(pizza)}
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
      )}

      {/* ---- Create/Edit dialog ---- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add pizza"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this menu item."
                : "Add a new pizza to the menu."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Margherita"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Input
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Classic tomato, mozzarella and basil"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-image">Image URL</Label>
              <Input
                id="p-image"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..."
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-ingredients">Ingredients (comma-separated)</Label>
              <Input
                id="p-ingredients"
                value={form.ingredients}
                onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                placeholder="Tomato, Mozzarella, Basil"
                disabled={saving}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Price</Label>
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-muted px-4">
                <Label htmlFor="p-available" className="cursor-pointer">
                  Available
                </Label>
                <Switch
                  id="p-available"
                  checked={form.isAvailable}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))}
                  disabled={saving}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Pizza"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Delete confirmation ---- */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the pizza from the menu. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

export default AdminPizzasPage;
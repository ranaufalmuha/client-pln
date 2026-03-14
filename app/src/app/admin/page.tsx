"use client";

import * as React from "react";

import {
  createBay,
  createBeban,
  createUnit,
  createUnitCategory,
  createUser,
  deleteBay,
  deleteBeban,
  deleteUnit,
  deleteUnitCategory,
  deleteUser,
  getBays,
  getBebans,
  getUnitCategories,
  getUnits,
  getUsers,
  updateBay,
  updateBeban,
  updateUnit,
  updateUnitCategory,
  updateUser,
  type AuthUser,
  type Bay,
  type Beban,
  type Unit,
  type UnitCategory,
} from "@/shared/lib/api";
import { useAppRouter } from "@/shared/lib/app-router";
import { DashboardShell } from "@/shared/components/dashboard-shell";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

type BebanForm = {
  id?: number;
  unitId: string;
  bayId: string;
  kv: string;
  a: string;
  mw: string;
  mvar: string;
  percentage: string;
  tap: string;
  measuredAt: string;
};

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function defaultBebanForm(): BebanForm {
  const now = new Date();
  return {
    unitId: "",
    bayId: "",
    kv: "",
    a: "",
    mw: "",
    mvar: "",
    percentage: "",
    tap: "",
    measuredAt: toLocalDateTimeInput(now.toISOString()),
  };
}

function asNumber(value: string, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} harus angka`);
  }

  return parsed;
}

export default function AdminPage() {
  const { navigate, token, currentUser } = useAppRouter();
  const isAdmin = currentUser?.isAdmin ?? false;

  const [users, setUsers] = React.useState<AuthUser[]>([]);
  const [unitCategories, setUnitCategories] = React.useState<UnitCategory[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [bays, setBays] = React.useState<Bay[]>([]);
  const [bebans, setBebans] = React.useState<Beban[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserPassword, setNewUserPassword] = React.useState("");
  const [newUserAdmin, setNewUserAdmin] = React.useState(false);

  const [newCategoryKey, setNewCategoryKey] = React.useState("");
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null);
  const [editingCategoryKey, setEditingCategoryKey] = React.useState("");
  const [editingCategoryName, setEditingCategoryName] = React.useState("");

  const [newUnitName, setNewUnitName] = React.useState("");
  const [newUnitCategoryId, setNewUnitCategoryId] = React.useState("");
  const [editingUnitId, setEditingUnitId] = React.useState<number | null>(null);
  const [editingUnitName, setEditingUnitName] = React.useState("");
  const [editingUnitCategoryId, setEditingUnitCategoryId] = React.useState("");

  const [newBayName, setNewBayName] = React.useState("");
  const [newBayUnitId, setNewBayUnitId] = React.useState("");
  const [editingBayId, setEditingBayId] = React.useState<number | null>(null);
  const [editingBayName, setEditingBayName] = React.useState("");
  const [editingBayUnitId, setEditingBayUnitId] = React.useState("");

  const [createBebanForm, setCreateBebanForm] = React.useState<BebanForm>(defaultBebanForm());
  const [editBebanForm, setEditBebanForm] = React.useState<BebanForm | null>(null);

  const getBaysByUnit = React.useCallback(
    (unitId: string) => {
      if (!unitId) {
        return [];
      }
      return bays.filter((bay) => String(bay.unitId) === unitId);
    },
    [bays],
  );

  const loadData = React.useCallback(async () => {
    if (!token || !isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [
        fetchedUsers,
        fetchedCategories,
        fetchedUnits,
        fetchedBays,
        fetchedBebans,
      ] = await Promise.all([
        getUsers(token),
        getUnitCategories(token),
        getUnits(token),
        getBays(token),
        getBebans(token),
      ]);
      setUsers(fetchedUsers);
      setUnitCategories(fetchedCategories);
      setUnits(fetchedUnits);
      setBays(fetchedBays);
      setBebans(fetchedBebans);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Gagal memuat data admin";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!newUnitCategoryId && unitCategories.length > 0) {
      setNewUnitCategoryId(String(unitCategories[0].id));
    }

    if (!newBayUnitId && units.length > 0) {
      setNewBayUnitId(String(units[0].id));
    }

    setCreateBebanForm((current) => {
      if (current.unitId || units.length === 0) {
        return current;
      }

      const unitId = String(units[0].id);
      const unitBays = bays.filter((bay) => String(bay.unitId) === unitId);
      return {
        ...current,
        unitId,
        bayId: unitBays[0] ? String(unitBays[0].id) : "",
      };
    });
  }, [bays, newBayUnitId, newUnitCategoryId, unitCategories, units]);

  const handleCreateUser = async () => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      const created = await createUser(token, {
        email: newUserEmail.trim(),
        password: newUserPassword,
        isAdmin: newUserAdmin,
      });
      setUsers((current) => [created, ...current]);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserAdmin(false);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal membuat user";
      setError(message);
    }
  };

  const handleUpdateUserRole = async (user: AuthUser, nextAdmin: boolean) => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      const updated = await updateUser(token, {
        id: user.id,
        email: user.email,
        isAdmin: nextAdmin,
      });
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal update user";
      setError(message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      await deleteUser(token, id);
      setUsers((current) => current.filter((item) => item.id !== id));
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal hapus user";
      setError(message);
    }
  };

  const handleCreateCategory = async () => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      const created = await createUnitCategory(token, {
        key: newCategoryKey.trim(),
        name: newCategoryName.trim(),
      });
      setUnitCategories((current) => [...current, created]);
      setNewCategoryKey("");
      setNewCategoryName("");
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Gagal membuat kategori";
      setError(message);
    }
  };

  const handleSaveCategory = async () => {
    if (!token || editingCategoryId === null) {
      return;
    }

    setError(null);
    try {
      const updated = await updateUnitCategory(token, {
        id: editingCategoryId,
        key: editingCategoryKey.trim(),
        name: editingCategoryName.trim(),
      });
      setUnitCategories((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setUnits((current) =>
        current.map((item) =>
          item.categoryId === updated.id
            ? {
                ...item,
                categoryKey: updated.key,
                categoryName: updated.name,
              }
            : item,
        ),
      );
      setBays((current) =>
        current.map((item) =>
          item.unitCategoryId === updated.id
            ? {
                ...item,
                unitCategoryKey: updated.key,
                unitCategoryName: updated.name,
              }
            : item,
        ),
      );
      setBebans((current) =>
        current.map((item) =>
          item.unitCategoryId === updated.id
            ? {
                ...item,
                unitCategoryKey: updated.key,
                unitCategoryName: updated.name,
              }
            : item,
        ),
      );
      setEditingCategoryId(null);
      setEditingCategoryKey("");
      setEditingCategoryName("");
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Gagal update kategori";
      setError(message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      await deleteUnitCategory(token, id);
      setUnitCategories((current) => current.filter((item) => item.id !== id));
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal hapus kategori";
      setError(message);
    }
  };

  const handleCreateUnit = async () => {
    if (!token || !newUnitCategoryId) {
      return;
    }

    setError(null);
    try {
      const created = await createUnit(token, {
        name: newUnitName.trim(),
        categoryId: Number(newUnitCategoryId),
      });
      setUnits((current) => [...current, created]);
      setNewUnitName("");
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal membuat unit";
      setError(message);
    }
  };

  const handleSaveUnit = async () => {
    if (!token || editingUnitId === null || !editingUnitCategoryId) {
      return;
    }

    setError(null);
    try {
      const updated = await updateUnit(token, {
        id: editingUnitId,
        name: editingUnitName.trim(),
        categoryId: Number(editingUnitCategoryId),
      });
      setUnits((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setBays((current) =>
        current.map((item) =>
          item.unitId === updated.id
            ? {
                ...item,
                unitName: updated.name,
                unitCategoryId: updated.categoryId,
                unitCategoryKey: updated.categoryKey,
                unitCategoryName: updated.categoryName,
              }
            : item,
        ),
      );
      setBebans((current) =>
        current.map((item) =>
          item.unitId === updated.id
            ? {
                ...item,
                unitName: updated.name,
                unitCategoryId: updated.categoryId,
                unitCategoryKey: updated.categoryKey,
                unitCategoryName: updated.categoryName,
              }
            : item,
        ),
      );
      setEditingUnitId(null);
      setEditingUnitName("");
      setEditingUnitCategoryId("");
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal update unit";
      setError(message);
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      await deleteUnit(token, id);
      setUnits((current) => current.filter((item) => item.id !== id));
      setBays((current) => current.filter((item) => item.unitId !== id));
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal hapus unit";
      setError(message);
    }
  };

  const handleCreateBay = async () => {
    if (!token || !newBayUnitId) {
      return;
    }

    setError(null);
    try {
      const created = await createBay(token, {
        unitId: Number(newBayUnitId),
        name: newBayName.trim(),
      });
      setBays((current) => [...current, created]);
      setNewBayName("");
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal membuat bay";
      setError(message);
    }
  };

  const handleSaveBay = async () => {
    if (!token || editingBayId === null || !editingBayUnitId) {
      return;
    }

    setError(null);
    try {
      const updated = await updateBay(token, {
        id: editingBayId,
        unitId: Number(editingBayUnitId),
        name: editingBayName.trim(),
      });
      setBays((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingBayId(null);
      setEditingBayName("");
      setEditingBayUnitId("");
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal update bay";
      setError(message);
    }
  };

  const handleDeleteBay = async (id: number) => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      await deleteBay(token, id);
      setBays((current) => current.filter((item) => item.id !== id));
      setBebans((current) =>
        current.map((item) => (item.bayId === id ? { ...item, bayId: null, bayName: null } : item)),
      );
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal hapus bay";
      setError(message);
    }
  };

  const handleCreateBeban = async () => {
    if (!token) {
      return;
    }

    if (!createBebanForm.bayId) {
      setError("Pilih bay terlebih dahulu");
      return;
    }

    setError(null);
    try {
      const created = await createBeban(token, {
        bayId: Number(createBebanForm.bayId),
        kv: asNumber(createBebanForm.kv, "kV"),
        a: asNumber(createBebanForm.a, "A"),
        mw: asNumber(createBebanForm.mw, "MW"),
        mvar: asNumber(createBebanForm.mvar, "MVAR"),
        percentage: asNumber(createBebanForm.percentage, "Percentage"),
        tap: createBebanForm.tap ? asNumber(createBebanForm.tap, "Tap") : null,
        measuredAt: new Date(createBebanForm.measuredAt).toISOString(),
      });
      setBebans((current) => [created, ...current]);
      setCreateBebanForm((current) => ({
        ...defaultBebanForm(),
        unitId: current.unitId,
        bayId: current.bayId,
      }));
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal membuat beban";
      setError(message);
    }
  };

  const handleSaveBeban = async () => {
    if (!token || !editBebanForm?.id || !editBebanForm.bayId) {
      return;
    }

    setError(null);
    try {
      const updated = await updateBeban(token, {
        id: editBebanForm.id,
        bayId: Number(editBebanForm.bayId),
        kv: asNumber(editBebanForm.kv, "kV"),
        a: asNumber(editBebanForm.a, "A"),
        mw: asNumber(editBebanForm.mw, "MW"),
        mvar: asNumber(editBebanForm.mvar, "MVAR"),
        percentage: asNumber(editBebanForm.percentage, "Percentage"),
        tap: editBebanForm.tap ? asNumber(editBebanForm.tap, "Tap") : null,
        measuredAt: new Date(editBebanForm.measuredAt).toISOString(),
      });
      setBebans((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditBebanForm(null);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal update beban";
      setError(message);
    }
  };

  const handleDeleteBeban = async (id: number) => {
    if (!token) {
      return;
    }

    setError(null);
    try {
      await deleteBeban(token, id);
      setBebans((current) => current.filter((item) => item.id !== id));
      if (editBebanForm?.id === id) {
        setEditBebanForm(null);
      }
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "Gagal hapus beban";
      setError(message);
    }
  };

  if (!isAdmin) {
    return (
      <DashboardShell title="Admin">
        <div className="grid gap-4 px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Akses Ditolak</CardTitle>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => navigate("/")}>
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Admin">
      <div className="space-y-4 px-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void loadData()}>
            Refresh
          </Button>
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <Tabs defaultValue="users" className="gap-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="bays">Bays</TabsTrigger>
            <TabsTrigger value="bebans">Bebans</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create User</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                <Input
                  placeholder="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                />
                <Input
                  placeholder="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newUserAdmin}
                    onCheckedChange={(checked) => setNewUserAdmin(Boolean(checked))}
                  />
                  Is Admin
                </label>
                <Button type="button" onClick={() => void handleCreateUser()}>
                  Create
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">ID {user.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={user.isAdmin}
                          onCheckedChange={(checked) =>
                            void handleUpdateUserRole(user, Boolean(checked))
                          }
                        />
                        Admin
                      </label>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Category</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="key (ex: penghantar-gitet)"
                  value={newCategoryKey}
                  onChange={(event) => setNewCategoryKey(event.target.value)}
                />
                <Input
                  placeholder="name"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                />
                <Button type="button" onClick={() => void handleCreateCategory()}>
                  Create
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unitCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    {editingCategoryId === category.id ? (
                      <div className="grid w-full gap-2 md:grid-cols-2">
                        <Input
                          value={editingCategoryKey}
                          onChange={(event) => setEditingCategoryKey(event.target.value)}
                        />
                        <Input
                          value={editingCategoryName}
                          onChange={(event) => setEditingCategoryName(event.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.key}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {editingCategoryId === category.id ? (
                        <>
                          <Button type="button" size="sm" onClick={() => void handleSaveCategory()}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryKey("");
                              setEditingCategoryName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditingCategoryKey(category.key);
                            setEditingCategoryName(category.name);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Unit</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Input
                  placeholder="Unit name"
                  value={newUnitName}
                  onChange={(event) => setNewUnitName(event.target.value)}
                />
                <Select value={newUnitCategoryId} onValueChange={setNewUnitCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitCategories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => void handleCreateUnit()}>
                  Create
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unit List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    {editingUnitId === unit.id ? (
                      <div className="grid w-full gap-2 md:grid-cols-2">
                        <Input
                          value={editingUnitName}
                          onChange={(event) => setEditingUnitName(event.target.value)}
                        />
                        <Select value={editingUnitCategoryId} onValueChange={setEditingUnitCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitCategories.map((category) => (
                              <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{unit.name}</p>
                        <p className="text-xs text-muted-foreground">{unit.categoryName}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {editingUnitId === unit.id ? (
                        <>
                          <Button type="button" size="sm" onClick={() => void handleSaveUnit()}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUnitId(null);
                              setEditingUnitName("");
                              setEditingUnitCategoryId("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUnitId(unit.id);
                            setEditingUnitName(unit.name);
                            setEditingUnitCategoryId(String(unit.categoryId));
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteUnit(unit.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bays" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Bay</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Select value={newBayUnitId} onValueChange={setNewBayUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name} - {unit.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Bay name"
                  value={newBayName}
                  onChange={(event) => setNewBayName(event.target.value)}
                />
                <Button type="button" onClick={() => void handleCreateBay()}>
                  Create
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bay List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bays.map((bay) => (
                  <div
                    key={bay.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    {editingBayId === bay.id ? (
                      <div className="grid w-full gap-2 md:grid-cols-2">
                        <Select value={editingBayUnitId} onValueChange={setEditingBayUnitId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={String(unit.id)}>
                                {unit.name} - {unit.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={editingBayName}
                          onChange={(event) => setEditingBayName(event.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{bay.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bay.unitName} - {bay.unitCategoryName}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {editingBayId === bay.id ? (
                        <>
                          <Button type="button" size="sm" onClick={() => void handleSaveBay()}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBayId(null);
                              setEditingBayName("");
                              setEditingBayUnitId("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingBayId(bay.id);
                            setEditingBayName(bay.name);
                            setEditingBayUnitId(String(bay.unitId));
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteBay(bay.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bebans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Beban</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Select
                  value={createBebanForm.unitId}
                  onValueChange={(value) => {
                    const unitBays = getBaysByUnit(value);
                    setCreateBebanForm((current) => ({
                      ...current,
                      unitId: value,
                      bayId: unitBays[0] ? String(unitBays[0].id) : "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name} - {unit.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={createBebanForm.bayId}
                  onValueChange={(value) =>
                    setCreateBebanForm((current) => ({ ...current, bayId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBaysByUnit(createBebanForm.unitId).map((bay) => (
                      <SelectItem key={bay.id} value={String(bay.id)}>
                        {bay.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="kV"
                  value={createBebanForm.kv}
                  onChange={(event) =>
                    setCreateBebanForm((current) => ({ ...current, kv: event.target.value }))
                  }
                />
                <Input
                  placeholder="A"
                  value={createBebanForm.a}
                  onChange={(event) =>
                    setCreateBebanForm((current) => ({ ...current, a: event.target.value }))
                  }
                />
                <Input
                  placeholder="MW"
                  value={createBebanForm.mw}
                  onChange={(event) =>
                    setCreateBebanForm((current) => ({ ...current, mw: event.target.value }))
                  }
                />
                <Input
                  placeholder="MVAR"
                  value={createBebanForm.mvar}
                  onChange={(event) =>
                    setCreateBebanForm((current) => ({ ...current, mvar: event.target.value }))
                  }
                />
                <Input
                  placeholder="%"
                  value={createBebanForm.percentage}
                  onChange={(event) =>
                    setCreateBebanForm((current) => ({
                      ...current,
                      percentage: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Tap"
                  value={createBebanForm.tap}
                  onChange={(event) =>
                    setCreateBebanForm((current) => ({ ...current, tap: event.target.value }))
                  }
                />
                <Input
                  type="datetime-local"
                  value={createBebanForm.measuredAt}
                  onChange={(event) =>
                    setCreateBebanForm((current) => ({
                      ...current,
                      measuredAt: event.target.value,
                    }))
                  }
                />
                <Button type="button" onClick={() => void handleCreateBeban()}>
                  Create
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beban List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bebans.map((beban) => (
                  <div
                    key={beban.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {beban.unitName ?? "-"} / {beban.bayName ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(beban.measuredAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const unitId =
                            beban.unitId ??
                            bays.find((item) => item.id === beban.bayId)?.unitId ??
                            null;
                          setEditBebanForm({
                            id: beban.id,
                            unitId: unitId ? String(unitId) : "",
                            bayId: beban.bayId ? String(beban.bayId) : "",
                            kv: String(beban.kv),
                            a: String(beban.a),
                            mw: String(beban.mw),
                            mvar: String(beban.mvar),
                            percentage: String(beban.percentage),
                            tap: beban.tap ? String(beban.tap) : "",
                            measuredAt: toLocalDateTimeInput(beban.measuredAt),
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteBeban(beban.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {editBebanForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Beban #{editBebanForm.id}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <Select
                    value={editBebanForm.unitId}
                    onValueChange={(value) => {
                      const unitBays = getBaysByUnit(value);
                      setEditBebanForm((current) =>
                        current
                          ? {
                              ...current,
                              unitId: value,
                              bayId: unitBays[0] ? String(unitBays[0].id) : "",
                            }
                          : current,
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)}>
                          {unit.name} - {unit.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={editBebanForm.bayId}
                    onValueChange={(value) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, bayId: value } : current,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bay" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBaysByUnit(editBebanForm.unitId).map((bay) => (
                        <SelectItem key={bay.id} value={String(bay.id)}>
                          {bay.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={editBebanForm.kv}
                    onChange={(event) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, kv: event.target.value } : current,
                      )
                    }
                  />
                  <Input
                    value={editBebanForm.a}
                    onChange={(event) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, a: event.target.value } : current,
                      )
                    }
                  />
                  <Input
                    value={editBebanForm.mw}
                    onChange={(event) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, mw: event.target.value } : current,
                      )
                    }
                  />
                  <Input
                    value={editBebanForm.mvar}
                    onChange={(event) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, mvar: event.target.value } : current,
                      )
                    }
                  />
                  <Input
                    value={editBebanForm.percentage}
                    onChange={(event) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, percentage: event.target.value } : current,
                      )
                    }
                  />
                  <Input
                    value={editBebanForm.tap}
                    onChange={(event) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, tap: event.target.value } : current,
                      )
                    }
                  />
                  <Input
                    type="datetime-local"
                    value={editBebanForm.measuredAt}
                    onChange={(event) =>
                      setEditBebanForm((current) =>
                        current ? { ...current, measuredAt: event.target.value } : current,
                      )
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={() => void handleSaveBeban()}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditBebanForm(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

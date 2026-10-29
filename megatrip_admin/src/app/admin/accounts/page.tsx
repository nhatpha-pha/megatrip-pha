"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Plus, Pencil, Trash2, Ban, CheckCircle2, RefreshCw, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useToast } from "../../components/ui/use-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

type Role = "admin" | "employee";
interface Account {
  _id?: string;
  id?: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
  status?: "active" | "blocked";
  createdAt?: string;
}
interface FormState {
  name: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  status: "active" | "blocked";
}

const emptyForm: FormState = { name: "", email: "", phone: "", role: "employee", password: "", status: "active" };
const roleLabel = (r: string) => (r === "admin" ? "Quản trị viên" : "Nhân viên");
const accId = (a: Account) => String(a._id || a.id || "");

// Gọi API kèm token đăng nhập, trả về JSON hoặc ném lỗi với thông báo của backend
async function call(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || `Lỗi ${res.status}`);
  return json;
}

export default function AccountsPage() {
  const { toast } = useToast();
  const [me, setMe] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isAdmin = me?.role === "admin";
  const myId = me ? accId(me) : "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meJson = await call("/api/auth/me");
      setMe(meJson.data || meJson);
      const q = search.trim() ? `&q=${encodeURIComponent(search.trim())}` : "";
      const json = await call(`/api/auth/users?role=admin,employee&page=1&limit=100${q}`);
      const payload = json.data || json;
      setAccounts(Array.isArray(payload) ? payload : payload.users || []);
    } catch (e: any) {
      toast({ title: "Không tải được danh sách tài khoản", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (a: Account) => {
    setEditing(a);
    setForm({
      name: a.name || "",
      email: a.email,
      phone: a.phone || "",
      role: a.role === "admin" ? "admin" : "employee",
      password: "",
      status: a.status === "blocked" ? "blocked" : "active",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.email.trim()) return toast({ title: "Thiếu email", variant: "destructive" });
    if (!editing && form.password.length < 6) {
      return toast({ title: "Mật khẩu tối thiểu 6 ký tự", variant: "destructive" });
    }
    if (editing && form.password && form.password.length < 6) {
      return toast({ title: "Mật khẩu mới tối thiểu 6 ký tự", variant: "destructive" });
    }
    setSaving(true);
    try {
      const body: any = { name: form.name, email: form.email.trim(), phone: form.phone, role: form.role, status: form.status };
      if (form.password) body.password = form.password;
      if (editing) {
        await call(`/api/auth/admin/user/${accId(editing)}`, { method: "PUT", body: JSON.stringify(body) });
        toast({ title: "Đã cập nhật tài khoản" });
      } else {
        await call("/api/auth/admin/user", { method: "POST", body: JSON.stringify({ ...body, isVerified: true }) });
        toast({ title: "Đã tạo tài khoản", description: `${form.email} (${roleLabel(form.role)})` });
      }
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Không lưu được tài khoản", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (a: Account) => {
    const next = a.status === "blocked" ? "active" : "blocked";
    try {
      await call(`/api/auth/admin/user/${accId(a)}`, { method: "PUT", body: JSON.stringify({ status: next }) });
      toast({ title: next === "blocked" ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản", description: a.email });
      await load();
    } catch (e: any) {
      toast({ title: "Thao tác thất bại", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (a: Account) => {
    if (!window.confirm(`Xoá tài khoản ${a.email}? Thao tác này không thể hoàn tác.`)) return;
    try {
      await call(`/api/auth/admin/user/${accId(a)}`, { method: "DELETE" });
      toast({ title: "Đã xoá tài khoản", description: a.email });
      await load();
    } catch (e: any) {
      toast({ title: "Không xoá được", description: e.message, variant: "destructive" });
    }
  };

  const stats = useMemo(
    () => ({
      total: accounts.length,
      admins: accounts.filter((a) => a.role === "admin").length,
      employees: accounts.filter((a) => a.role !== "admin").length,
      blocked: accounts.filter((a) => a.status === "blocked").length,
    }),
    [accounts]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6" /> Quản lý tài khoản quản trị
          </h1>
          <p className="text-sm text-muted-foreground">Tạo, phân quyền, khoá và đặt lại mật khẩu cho quản trị viên và nhân viên.</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Thêm tài khoản
          </Button>
        )}
      </div>

      {me && !isAdmin && (
        <Card>
          <CardContent className="py-6 text-sm text-red-600">
            Chỉ tài khoản quản trị viên (admin) mới được quản lý tài khoản admin/nhân viên.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Tổng tài khoản", stats.total],
          ["Quản trị viên", stats.admins],
          ["Nhân viên", stats.employees],
          ["Đang bị khoá", stats.blocked],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài khoản</CardTitle>
          <CardDescription>Vai trò: Quản trị viên (toàn quyền) • Nhân viên (chỉ xử lý đơn đặt và chăm sóc khách hàng)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <Button variant="outline" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Tải lại
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Điện thoại</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={6}>Đang tải...</td>
                  </tr>
                )}
                {!loading && accounts.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={6}>Chưa có tài khoản quản trị nào</td>
                  </tr>
                )}
                {accounts.map((a) => {
                  const self = accId(a) === myId;
                  return (
                    <tr key={accId(a)} className="border-t">
                      <td className="p-3 font-medium">
                        {a.name || "(chưa đặt tên)"} {self && <span className="text-xs text-muted-foreground">(bạn)</span>}
                      </td>
                      <td className="p-3">{a.email}</td>
                      <td className="p-3">{a.phone || "—"}</td>
                      <td className="p-3">
                        <Badge variant={a.role === "admin" ? "default" : "secondary"}>{roleLabel(a.role)}</Badge>
                      </td>
                      <td className="p-3">
                        {a.status === "blocked" ? <Badge variant="destructive">Đã khoá</Badge> : <Badge variant="outline">Hoạt động</Badge>}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" title="Sửa / đặt lại mật khẩu" disabled={!isAdmin} onClick={() => openEdit(a)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={a.status === "blocked" ? "Mở khoá" : "Khoá tài khoản"}
                            disabled={!isAdmin || self}
                            onClick={() => toggleBlock(a)}
                          >
                            {a.status === "blocked" ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" title="Xoá" disabled={!isAdmin || self} onClick={() => remove(a)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa tài khoản quản trị" : "Thêm tài khoản quản trị"}</DialogTitle>
            <DialogDescription>
              {editing ? "Để trống mật khẩu nếu không muốn đổi." : "Tài khoản mới đăng nhập được ngay vào trang quản trị."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="acc-name">Họ tên</Label>
              <Input id="acc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-email">Email *</Label>
              <Input id="acc-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-phone">Số điện thoại</Label>
              <Input id="acc-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="acc-role">Vai trò</Label>
                <select
                  id="acc-role"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={form.role}
                  disabled={!!editing && accId(editing) === myId}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  <option value="employee">Nhân viên</option>
                  <option value="admin">Quản trị viên (admin)</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="acc-status">Trạng thái</Label>
                <select
                  id="acc-status"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={form.status}
                  disabled={!!editing && accId(editing) === myId}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "blocked" })}
                >
                  <option value="active">Hoạt động</option>
                  <option value="blocked">Khoá</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-pass" className="flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5" /> {editing ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu *"}
              </Label>
              <Input
                id="acc-pass"
                type="password"
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Huỷ
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

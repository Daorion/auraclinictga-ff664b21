import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, ShieldCheck, KeyRound, Trash2 } from "lucide-react";

interface Prof {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  commission_percent: number | null;
  active: boolean;
  display_order: number | null;
  user_id: string | null;
}

const AdminProfissionalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState<Prof | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePass, setInvitePass] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from("professionals").select("*").eq("id", id).maybeSingle();
    setP(data as Prof | null);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    if (!p) return;
    setSaving(true);
    const { error } = await supabase
      .from("professionals")
      .update({
        name: p.name,
        slug: p.slug,
        title: p.title,
        bio: p.bio,
        photo_url: p.photo_url,
        whatsapp_phone: p.whatsapp_phone,
        commission_percent: p.commission_percent ?? 0,
        active: p.active,
        display_order: p.display_order,
      })
      .eq("id", p.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else toast.success("Salvo");
  };

  const openInvite = () => {
    setInviteEmail(p?.email ?? "");
    setInvitePass("");
    setInviteOpen(true);
  };

  const sendInvite = async () => {
    if (!p) return;
    if (!inviteEmail || invitePass.length < 6) {
      toast.error("E-mail e senha (mín. 6 caracteres) obrigatórios");
      return;
    }
    setInviting(true);
    const { data, error } = await supabase.functions.invoke("invite-professional", {
      body: { professional_id: p.id, email: inviteEmail.trim(), password: invitePass },
    });
    setInviting(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? "Falha ao convidar");
      return;
    }
    toast.success("Acesso configurado");
    setInviteOpen(false);
    load();
  };

  const revokeAccess = async () => {
    if (!p?.user_id) return;
    if (!confirm("Revogar acesso desta profissional ao painel?")) return;
    // Remove role e desvincula
    await supabase.from("user_roles").delete().eq("user_id", p.user_id).eq("role", "profissional");
    const { error } = await supabase.from("professionals").update({ user_id: null }).eq("id", p.id);
    if (error) toast.error("Erro ao revogar");
    else { toast.success("Acesso revogado"); load(); }
  };

  if (loading || !p) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/profissionais" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      <header className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
          {p.photo_url && <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{p.name}</h1>
          <p className="text-muted-foreground">{p.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {p.user_id ? (
            <Badge variant="outline" className="gap-1"><ShieldCheck className="w-3 h-3" /> acesso ativo</Badge>
          ) : (
            <Badge variant="secondary">sem acesso</Badge>
          )}
        </div>
      </header>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="acesso">Acesso ao painel</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Título / Especialidade</Label>
                <Input value={p.title ?? ""} onChange={(e) => setP({ ...p, title: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Bio</Label>
                <Textarea rows={5} value={p.bio ?? ""} onChange={(e) => setP({ ...p, bio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>URL da foto</Label>
                <Input value={p.photo_url ?? ""} onChange={(e) => setP({ ...p, photo_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input placeholder="5511999999999" value={p.whatsapp_phone ?? ""} onChange={(e) => setP({ ...p, whatsapp_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Comissão padrão (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={p.commission_percent ?? 0}
                  onChange={(e) => setP({ ...p, commission_percent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem de exibição</Label>
                <Input
                  type="number"
                  value={p.display_order ?? 0}
                  onChange={(e) => setP({ ...p, display_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between col-span-2">
                <Label>Ativa</Label>
                <Switch checked={p.active} onCheckedChange={(v) => setP({ ...p, active: v })} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="acesso">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold">Acesso ao painel</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ao conceder acesso, a profissional entra em <code>/admin/login</code> com o e-mail e senha definidos e vê apenas os próprios dados (agenda, clientes atendidos e comissões).
              </p>
            </div>
            {p.user_id ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">E-mail:</span> <strong>{p.email}</strong>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={openInvite}>
                    <KeyRound className="w-4 h-4 mr-2" /> Redefinir senha / e-mail
                  </Button>
                  <Button variant="ghost" onClick={revokeAccess}>
                    <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Revogar acesso
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={openInvite}>
                <ShieldCheck className="w-4 h-4 mr-2" /> Conceder acesso
              </Button>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.user_id ? "Atualizar acesso" : "Conceder acesso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Senha (mín. 6)</Label>
              <Input type="text" value={invitePass} onChange={(e) => setInvitePass(e.target.value)} />
              <p className="text-xs text-muted-foreground">Compartilhe com a profissional em canal seguro.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={sendInvite} disabled={inviting}>
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfissionalDetail;

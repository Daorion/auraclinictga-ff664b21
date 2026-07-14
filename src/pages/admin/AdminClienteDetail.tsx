import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Phone, Mail, MapPin, Calendar, IdCard, MessageCircle, Save, Plus, Upload, Trash2,
} from "lucide-react";

interface Client {
  id: string; name: string; phone: string | null; whatsapp_phone: string | null;
  email: string | null; birth_date: string | null; cpf: string | null;
  address: string | null; city: string | null; state: string | null;
  notes: string | null; tags: string[] | null;
}
interface Note { id: string; note_type: string; content: string; created_at: string; }
interface Photo { id: string; photo_url: string; storage_path: string | null; label: string | null; taken_at: string | null; created_at: string; }

const AdminClienteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("evolucao");
  const [uploading, setUploading] = useState(false);
  const [photoLabel, setPhotoLabel] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: c }, { data: n }, { data: p }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).maybeSingle(),
      supabase.from("client_notes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("client_photos").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    ]);
    setClient(c as Client | null);
    setNotes((n as Note[]) ?? []);
    // Sign URLs for private bucket
    const withUrls = await Promise.all(((p as Photo[]) ?? []).map(async (ph) => {
      if (ph.storage_path) {
        const { data } = await supabase.storage.from("client-photos").createSignedUrl(ph.storage_path, 3600);
        return { ...ph, photo_url: data?.signedUrl ?? ph.photo_url };
      }
      return ph;
    }));
    setPhotos(withUrls);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    const { error } = await supabase.from("clients").update({
      name: client.name,
      phone: client.phone,
      whatsapp_phone: client.whatsapp_phone,
      email: client.email,
      birth_date: client.birth_date,
      cpf: client.cpf,
      address: client.address,
      city: client.city,
      state: client.state,
      notes: client.notes,
    }).eq("id", client.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cliente atualizado");
  };

  const addNote = async () => {
    if (!newNote.trim() || !id) return;
    const { error } = await supabase.from("client_notes").insert({
      client_id: id, content: newNote.trim(), note_type: noteType,
    });
    if (error) { toast.error(error.message); return; }
    setNewNote("");
    load();
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm("Excluir esta anotação?")) return;
    const { error } = await supabase.from("client_notes").delete().eq("id", noteId);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Máx. 10 MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("client-photos").upload(path, file);
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { error: dbErr } = await supabase.from("client_photos").insert({
      client_id: id, storage_path: path, photo_url: path, label: photoLabel || null,
    });
    setUploading(false);
    if (dbErr) { toast.error(dbErr.message); return; }
    setPhotoLabel("");
    e.target.value = "";
    toast.success("Foto enviada");
    load();
  };

  const deletePhoto = async (photo: Photo) => {
    if (!confirm("Excluir esta foto?")) return;
    if (photo.storage_path) await supabase.storage.from("client-photos").remove([photo.storage_path]);
    await supabase.from("client_photos").delete().eq("id", photo.id);
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!client) return <div className="text-center py-20 text-muted-foreground">Cliente não encontrado</div>;

  const whatsappLink = client.whatsapp_phone
    ? `https://wa.me/${client.whatsapp_phone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/clientes"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
        </Button>
      </div>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {client.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>}
            {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
            {client.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{client.city}{client.state ? `/${client.state}` : ""}</span>}
          </div>
        </div>
        {whatsappLink && (
          <Button asChild variant="outline">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </a>
          </Button>
        )}
      </header>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="anamnese">Anamnese &amp; Evolução ({notes.length})</TabsTrigger>
          <TabsTrigger value="fotos">Fotos ({photos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Nome</Label>
              <Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={client.phone ?? ""} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={client.whatsapp_phone ?? ""} onChange={(e) => setClient({ ...client, whatsapp_phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={client.email ?? ""} onChange={(e) => setClient({ ...client, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label><Calendar className="w-3.5 h-3.5 inline mr-1" />Nascimento</Label>
              <Input type="date" value={client.birth_date ?? ""} onChange={(e) => setClient({ ...client, birth_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label><IdCard className="w-3.5 h-3.5 inline mr-1" />CPF</Label>
              <Input value={client.cpf ?? ""} onChange={(e) => setClient({ ...client, cpf: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade / UF</Label>
              <div className="flex gap-2">
                <Input value={client.city ?? ""} onChange={(e) => setClient({ ...client, city: e.target.value })} />
                <Input maxLength={2} className="w-16" value={client.state ?? ""} onChange={(e) => setClient({ ...client, state: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Endereço</Label>
              <Input value={client.address ?? ""} onChange={(e) => setClient({ ...client, address: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Observações gerais</Label>
              <Textarea rows={4} value={client.notes ?? ""} onChange={(e) => setClient({ ...client, notes: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar</>}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="anamnese">
          <Card className="p-6 space-y-4">
            <div className="flex gap-2">
              <select
                className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
              >
                <option value="anamnese">Anamnese</option>
                <option value="evolucao">Evolução</option>
                <option value="observacao">Observação</option>
              </select>
            </div>
            <Textarea
              rows={4}
              placeholder="Descreva a anamnese, evolução do tratamento, observações clínicas..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={addNote} disabled={!newNote.trim()}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar anotação
              </Button>
            </div>
          </Card>

          <div className="space-y-3 mt-4">
            {notes.map((n) => (
              <Card key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {n.note_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteNote(n.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma anotação ainda.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fotos">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Rótulo (ex.: Antes, Depois, Sessão 1)"
                value={photoLabel}
                onChange={(e) => setPhotoLabel(e.target.value)}
                className="md:col-span-2"
              />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Enviar foto</>}
                </div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">JPG/PNG até 10 MB. Fotos ficam em bucket privado.</p>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {photos.map((p) => (
              <Card key={p.id} className="overflow-hidden group relative">
                <img src={p.photo_url} alt={p.label ?? "Foto"} className="w-full aspect-square object-cover" />
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{p.label ?? "Sem rótulo"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.taken_at ? new Date(p.taken_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
                <button
                  onClick={() => deletePhoto(p)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </Card>
            ))}
            {photos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">Nenhuma foto ainda.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminClienteDetail;

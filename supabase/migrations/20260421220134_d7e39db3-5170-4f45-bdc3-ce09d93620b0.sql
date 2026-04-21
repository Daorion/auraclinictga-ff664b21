-- Storage bucket público para artes geradas
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

-- Política: leitura pública das artes
CREATE POLICY "Artworks são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

-- Política: apenas admins fazem upload
CREATE POLICY "Admins podem fazer upload de artes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));

-- Política: apenas admins atualizam
CREATE POLICY "Admins podem atualizar artes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));

-- Política: apenas admins removem
CREATE POLICY "Admins podem remover artes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artworks' AND public.has_role(auth.uid(), 'admin'));

-- Tabela de artes geradas (histórico)
CREATE TABLE public.generated_artworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('story', 'post', 'carousel', 'flyer')),
  background_url TEXT NOT NULL,
  final_url TEXT,
  caption TEXT,
  hashtags TEXT,
  overlay_data JSONB DEFAULT '{}'::jsonb,
  ai_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artworks_admin_all" ON public.generated_artworks
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER artworks_updated_at
BEFORE UPDATE ON public.generated_artworks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_artworks_created ON public.generated_artworks(created_at DESC);
CREATE INDEX idx_artworks_format ON public.generated_artworks(format);
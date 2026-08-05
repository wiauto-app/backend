interface StrapiWebhookCategoriaNoticia {
  id?: number;
  documentId?: string;
  slug?: string | null;
  nombre?: string | null;
  name?: string | null;
}

interface StrapiWebhookNoticiaEntry {
  id?: number;
  documentId?: string;
  slug?: string | null;
  titulo?: string | null;
  title?: string | null;
  resumen?: string | null;
  summary?: string | null;
  descripcion_corta?: string | null;
  categoria_noticia?: StrapiWebhookCategoriaNoticia | null;
}

export interface StrapiWebhookPayload {
  event?: string;
  model?: string;
  uid?: string;
  entry?: StrapiWebhookNoticiaEntry | null;
}

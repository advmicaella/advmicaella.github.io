import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().max(160),
    categoria: z.enum([
      'Regularização Fundiária',
      'Usucapião',
      'ITBI e IPTU',
      'Jurisprudência',
      'Direito Imobiliário',
      'Cartório e Registro',
    ]),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog };

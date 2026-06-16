import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'Blog Jurídico — Micaella Dallagnolli Freitas',
    description: 'Conteúdo educativo sobre direito imobiliário, regularização fundiária e direito imobiliário em Porto Velho, Rondônia. Micaella Dallagnolli Freitas — OAB/RO 14.891.',
    site: context.site,
    items: posts
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map(post => ({
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.excerpt,
        link: `/blog/${post.slug}/`,
      })),
    customData: '<language>pt-br</language>',
  });
}

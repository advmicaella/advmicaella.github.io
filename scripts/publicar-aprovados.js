import { google } from 'googleapis';
import { writeFileSync, appendFileSync } from 'fs';
import path from 'path';

const PASTA_APROVADO = process.env.GOOGLE_DRIVE_PASTA_APROVACAO;
const PASTA_ARQUIVO = process.env.GOOGLE_DRIVE_PASTA_ARQUIVO;
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}

function saida(publicados) {
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `publicados=${publicados}\n`);
}

async function main() {
  const credenciais = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const auth = new google.auth.GoogleAuth({
    credentials: credenciais,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const { data } = await drive.files.list({
    q: `'${PASTA_APROVADO}' in parents and name contains '-blog.md' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'createdTime',
  });

  if (!data.files || data.files.length === 0) {
    console.log('Nenhum artigo aprovado para publicar.');
    saida('false');
    return;
  }

  console.log(`📋 ${data.files.length} artigo(s) encontrado(s) em "Aprovado".`);
  let count = 0;

  for (const file of data.files) {
    console.log(`\n⬇️  Baixando: ${file.name}`);

    const res = await drive.files.get(
      { fileId: file.id, alt: 'media' },
      { responseType: 'text' }
    );
    const content = String(res.data);

    const titleMatch = content.match(/^title:\s*["'](.+?)["']\s*$/m)
      || content.match(/^title:\s*(.+?)\s*$/m);
    const rawTitle = titleMatch ? titleMatch[1] : file.name.replace(/-blog\.md$/, '');
    const slug = slugify(rawTitle);

    if (!slug) {
      console.warn(`⚠️  Slug vazio para ${file.name} — pulando.`);
      continue;
    }

    const blogPath = path.join('src/content/blog', `${slug}.md`);
    writeFileSync(blogPath, content, 'utf8');
    console.log(`✅ Salvo em: ${blogPath}`);

    if (PASTA_ARQUIVO) {
      await drive.files.update({
        fileId: file.id,
        addParents: PASTA_ARQUIVO,
        removeParents: PASTA_APROVADO,
        fields: 'id, parents',
      });
      console.log(`📦 Movido para "Arquivo": ${file.name}`);
    }

    count++;
  }

  console.log(`\n🎉 ${count} artigo(s) publicado(s).`);
  saida(count > 0 ? 'true' : 'false');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  saida('false');
  process.exit(1);
});

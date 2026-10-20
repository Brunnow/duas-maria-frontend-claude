import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiEdit2, FiImage, FiSearch, FiTag, FiTrash2 } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ProductForm from '@/components/admin/ProductForm';
import ProductImagesManager from '@/components/admin/ProductImagesManager';
import ProductVariantsManager from '@/components/admin/ProductVariantsManager';
import { useFetch } from '@/hooks/useFetch';
import * as adminService from '@/services/adminService';
import { fetchCategories } from '@/store/actions';
import { formatCurrency } from '@/lib/format';
import { productImageUrl } from '@/lib/media';
import OptimizedImage from '@/components/shared/OptimizedImage';
import ColorSwatch from '@/components/shared/ColorSwatch';

const errText = (err, fallback) => err?.response?.data?.message || fallback;

// O backend responde em inglês quando o nome já existe na categoria, e a
// validação (400) vem como { campo: mensagem }, sem `message`.
const saveErrText = (err) => {
  const data = err?.response?.data;
  if (data?.message === 'Product already exist!!') {
    return 'Já existe um produto com esse nome nesta categoria.';
  }
  if (!data?.message && (data?.description || data?.productName)) {
    return data.description || data.productName;
  }
  return errText(err, 'Não foi possível salvar o produto.');
};

/**
 * Cria, em sequência, as variações e as fotos de um produto recém-criado. Cada
 * etapa que falha é anotada e as outras seguem (uma foto recusada não impede
 * as demais). As fotos de uma cor só sobem se a cor foi criada (o backend
 * recusa foto de cor que o produto não tem). Fotos vão uma por vez: a
 * primeira enviada vira a principal e o andamento fica visível.
 */
async function createVariationsAndPhotos(productId, { variants, photos, colors, onProgress }) {
  const problems = [];
  let photosSent = 0;

  const sendPhotos = async (files, color) => {
    for (let i = 0; i < files.length; i += 1) {
      onProgress(`Enviando foto ${i + 1} de ${files.length}${color ? ` da cor ${color}` : ''}…`);
      try {
        if (color) await adminService.uploadProductImages(productId, [files[i]], color);
        else await adminService.uploadProductImages(productId, [files[i]]);
        photosSent += 1;
      } catch (err) {
        problems.push({
          step: 'photos',
          message: `foto ${files[i].name} (${errText(err, 'não enviada')}).`,
        });
      }
    }
  };

  if (colors?.length > 0) {
    for (const color of colors) {
      onProgress(`Criando a cor ${color.name}…`);
      try {
        await adminService.createVariants(productId, color.grid, {
          color: color.name,
          colorHex: color.hex,
        });
      } catch (err) {
        problems.push({
          step: 'variants',
          message: `cor ${color.name} (${errText(err, 'não criada')}).`,
        });
        if (color.files.length) {
          problems.push({ step: 'photos', message: `fotos da cor ${color.name}.` });
        }
        continue;
      }
      await sendPhotos(color.files, color.name);
    }
  } else {
    if (variants?.length > 0) {
      onProgress('Criando os tamanhos…');
      try {
        await adminService.createVariants(productId, variants);
      } catch (err) {
        problems.push({
          step: 'variants',
          message: `${errText(err, 'a grade de tamanhos falhou.')} Ajuste em “Tamanhos e estoque”.`,
        });
      }
    }
    await sendPhotos(photos || []);
  }
  return { problems, photosSent };
}

export default function AdminProdutos() {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.products.categories) || [];

  const [page, setPage] = useState(1);
  // Busca aplicada (vai para a API) vs. o que está sendo digitado.
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const fetcher = useCallback(
    () => adminService.listProducts({ pageNumber: page - 1, keyword: query || undefined }),
    [page, query],
  );
  const { status, data, error, refetch } = useFetch(fetcher, [page, query]);
  const list = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.totalElements;

  // Guarda o próprio produto (não só o id): se a lista mudar com o formulário
  // aberto (busca, outra página), a edição continua sendo edição — antes o
  // produto "sumia" da lista e o salvar virava criação de um produto novo.
  const [editing, setEditing] = useState(null); // null | 'new' | produto
  const [managingImages, setManagingImages] = useState(null); // null | productId
  const [managingVariants, setManagingVariants] = useState(null); // null | productId
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null); // etapa da criação em andamento
  const [toDelete, setToDelete] = useState(null); // produto aguardando confirmação
  const [notice, setNotice] = useState(null);
  // Erro do salvamento, mostrado junto ao botão do formulário (o `notice` fica
  // no topo da página e, no celular, fora da tela de quem clicou em salvar).
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Os painéis (formulário, imagens, tamanhos) abrem no topo da página, mas o
  // clique vem da lista lá embaixo (ou do botão de salvar no fim do formulário):
  // leva a tela até o painel que acabou de abrir.
  const formRef = useRef(null);
  const imagesRef = useRef(null);
  const variantsRef = useRef(null);
  const scrollTo = (ref) => ref.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  useEffect(() => {
    if (editing !== null) scrollTo(formRef);
  }, [editing]);
  useEffect(() => {
    if (managingImages !== null) scrollTo(imagesRef);
  }, [managingImages]);
  useEffect(() => {
    if (managingVariants !== null) scrollTo(variantsRef);
  }, [managingVariants]);

  const editingProduct = editing && editing !== 'new' ? editing : null;

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(draft.trim());
  };

  const clearSearch = () => {
    setDraft('');
    setPage(1);
    setQuery('');
  };

  const handleSubmit = async ({ categoryId, product, variants, photos, colors }) => {
    setSaving(true);
    setNotice(null);
    setFormError(null);
    try {
      if (product.productId) {
        await adminService.updateProduct(product.productId, product);
        if (categoryId) {
          // Depois dos dados: a checagem de nome repetido na categoria nova
          // usa o nome já salvo.
          await adminService.changeProductCategory(product.productId, categoryId);
          setNotice('Produto atualizado e movido de categoria.');
        }
        setEditing(null);
        refetch();
      } else {
        setProgress('Criando o produto…');
        const created = await adminService.createProduct(categoryId, product);
        const result = await createVariationsAndPhotos(created.productId, {
          variants,
          photos,
          colors,
          onProgress: setProgress,
        });
        reportCreation(created.productId, result, { variants, photos, colors });
        setEditing(null);
        refetch();
      }
    } catch (err) {
      setFormError(saveErrText(err));
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  // Depois de criar: diz o que foi feito e, se algo faltou, abre o painel
  // certo do produto novo (ele já existe — nada se perde) para concluir.
  const reportCreation = (productId, { problems, photosSent }, { variants, photos, colors }) => {
    const hadVariations = colors?.length > 0 || variants?.length > 0;
    const hadPhotos = photos?.length > 0 || colors?.some((c) => c.files.length > 0);

    if (problems.length > 0) {
      setNotice(`Produto criado, mas faltou: ${problems.map((p) => p.message).join(' ')}`);
      if (problems.some((p) => p.step === 'variants')) setManagingVariants(productId);
      if (problems.some((p) => p.step === 'photos')) setManagingImages(productId);
      return;
    }
    if (!hadPhotos) {
      // Sem fotos escolhidas: o próximo passo natural é o painel de imagens.
      setManagingImages(productId);
      setNotice(
        hadVariations
          ? 'Produto e tamanhos criados. Agora adicione as fotos abaixo.'
          : 'Produto criado. Adicione as fotos abaixo e defina os tamanhos em “Tamanhos e estoque” para vendê-lo.',
      );
      return;
    }
    const colorsText =
      colors?.length > 0 ? ` com ${colors.length} ${colors.length === 1 ? 'cor' : 'cores'}` : '';
    setNotice(
      `Produto criado${colorsText} e ${photosSent} ${photosSent === 1 ? 'foto enviada' : 'fotos enviadas'}.` +
        (hadVariations ? '' : ' Defina os tamanhos em “Tamanhos e estoque” para vendê-lo.'),
    );
  };

  // Erros sobem para o ConfirmDialog, que os mostra dentro do próprio diálogo.
  const confirmDelete = async () => {
    const { productId, productName } = toDelete;
    await adminService.deleteProduct(productId);
    if (editingProduct?.productId === productId) setEditing(null);
    if (managingImages === productId) setManagingImages(null);
    if (managingVariants === productId) setManagingVariants(null);
    setNotice(`Produto “${productName}” excluído.`);
    refetch();
  };

  const closeImages = () => {
    setManagingImages(null);
    refetch(); // a imagem principal pode ter mudado
  };

  const closeVariants = () => {
    setManagingVariants(null);
    refetch(); // o estoque total exibido na lista pode ter mudado
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl text-foreground">Produtos</h2>
        {editing === null && (
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setEditing('new');
            }}
          >
            Novo produto
          </Button>
        )}
      </div>

      {notice && (
        <p role="status" className="mt-3 text-sm text-muted">
          {notice}
        </p>
      )}

      {editing !== null && (
        <div ref={formRef} className="mt-5 scroll-mt-4 rounded-card border border-border p-5">
          <ProductForm
            // Remonta ao trocar de produto: o formulário guarda os valores no
            // próprio estado e, sem isto, editar B com A aberto salvava os
            // dados de A em B.
            key={editingProduct?.productId ?? 'new'}
            product={editingProduct}
            categories={categories}
            submitting={saving}
            progress={progress}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormError(null);
              setEditing(null);
            }}
          />
        </div>
      )}

      {managingImages !== null && (
        <div ref={imagesRef} className="mt-5 scroll-mt-4">
          <ProductImagesManager productId={managingImages} onClose={closeImages} />
        </div>
      )}

      {managingVariants !== null && (
        <div ref={variantsRef} className="mt-5 scroll-mt-4">
          <ProductVariantsManager
            key={managingVariants}
            productId={managingVariants}
            productColors={list.find((p) => p.productId === managingVariants)?.colors}
            onClose={closeVariants}
          />
        </div>
      )}

      <form onSubmit={applySearch} role="search" className="mt-5 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label="Buscar produto"
            type="search"
            placeholder="Nome do produto"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary" aria-label="Buscar">
          <FiSearch size={16} />
        </Button>
        {query && (
          <Button type="button" variant="ghost" onClick={clearSearch}>
            Limpar
          </Button>
        )}
      </form>

      {status === 'ready' && query && total != null && (
        <p className="mt-3 text-xs text-muted">
          {total === 1 ? '1 produto encontrado' : `${total} produtos encontrados`} para “{query}”.
        </p>
      )}

      <div className="mt-3">
        {status === 'loading' ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : status === 'error' ? (
          <ErrorState
            message={error}
            action={
              <Button variant="secondary" size="sm" onClick={refetch}>
                Tentar novamente
              </Button>
            }
          />
        ) : list.length === 0 ? (
          query ? (
            <EmptyState
              title="Nenhum produto encontrado"
              description={`Nenhum produto com “${query}” no nome.`}
            />
          ) : (
            <EmptyState title="Nenhum produto" description="Crie o primeiro produto." />
          )
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {list.map((product) => (
              <li key={product.productId} className="flex items-center gap-3 py-3">
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded-card bg-subtle">
                  <OptimizedImage
                    src={productImageUrl(product.image)}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{product.productName}</p>
                  <p className="text-xs text-muted">
                    {formatCurrency(product.specialPrice ?? product.price)} · estoque{' '}
                    {product.stock ?? 0}
                  </p>
                  {product.colors?.length > 0 && (
                    <p
                      className="mt-1 flex flex-wrap items-center gap-1"
                      aria-label={`Cores: ${product.colors.map((c) => c.name).join(', ')}`}
                    >
                      {product.colors.map((c) => (
                        <ColorSwatch
                          key={c.name}
                          name={c.name}
                          hex={c.hex}
                          image={c.image}
                          size="sm"
                          soldOut={!c.inStock}
                        />
                      ))}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManagingVariants(product.productId)}
                    aria-label={`Tamanhos e estoque de ${product.productName}`}
                  >
                    <FiTag size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManagingImages(product.productId)}
                    aria-label={`Gerenciar imagens de ${product.productName}`}
                  >
                    <FiImage size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormError(null);
                      setEditing(product);
                    }}
                    aria-label={`Editar ${product.productName}`}
                  >
                    <FiEdit2 size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotice(null);
                      setToDelete(product);
                    }}
                    aria-label={`Excluir ${product.productName}`}
                  >
                    <FiTrash2 size={15} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination className="mt-8" page={page} totalPages={totalPages} onChange={setPage} />

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir produto"
        description={
          <>
            Tem certeza que deseja excluir <strong>{toDelete?.productName}</strong>? Essa ação não
            pode ser desfeita.
          </>
        }
        confirmLabel="Excluir produto"
        errorFallback="Não foi possível excluir o produto."
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiEdit2, FiImage, FiTrash2 } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ProductForm from '@/components/admin/ProductForm';
import { useFetch } from '@/hooks/useFetch';
import * as adminService from '@/services/adminService';
import { fetchCategories } from '@/store/actions';
import { formatCurrency } from '@/lib/format';
import { productImageUrl } from '@/lib/media';

const errText = (err, fallback) => err?.response?.data?.message || fallback;

export default function AdminProdutos() {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.products.categories) || [];

  const [page, setPage] = useState(1);
  const fetcher = useCallback(() => adminService.listProducts({ pageNumber: page - 1 }), [page]);
  const { status, data, error, refetch } = useFetch(fetcher, [page]);
  const list = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const [editing, setEditing] = useState(null); // null | 'new' | productId
  const [saving, setSaving] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const editingProduct =
    typeof editing === 'number' ? list.find((p) => p.productId === editing) : null;

  const handleSubmit = async ({ categoryId, product }) => {
    setSaving(true);
    setNotice(null);
    try {
      if (product.productId) {
        await adminService.updateProduct(product.productId, product);
      } else {
        await adminService.createProduct(categoryId, product);
        setNotice(
          'Produto criado. Configure a grade de tamanhos em Estoque para deixá-lo à venda.',
        );
      }
      setEditing(null);
      refetch();
    } catch (err) {
      setNotice(errText(err, 'Não foi possível salvar o produto.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Excluir este produto?')) return;
    setRowBusy(productId);
    setNotice(null);
    try {
      await adminService.deleteProduct(productId);
      refetch();
    } catch (err) {
      setNotice(errText(err, 'Não foi possível excluir o produto.'));
    } finally {
      setRowBusy(null);
    }
  };

  const pickImage = (productId) => {
    uploadTargetRef.current = productId;
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const productId = uploadTargetRef.current;
    if (!file || !productId) return;
    setRowBusy(productId);
    setNotice(null);
    try {
      await adminService.uploadProductImage(productId, file);
      refetch();
    } catch (err) {
      setNotice(errText(err, 'Não foi possível enviar a imagem.'));
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl text-foreground">Produtos</h2>
        {editing === null && (
          <Button size="sm" onClick={() => setEditing('new')}>
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
        <div className="mt-5 rounded-card border border-border p-5">
          <ProductForm
            product={editingProduct}
            categories={categories}
            submitting={saving}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="mt-5">
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
          <EmptyState title="Nenhum produto" description="Crie o primeiro produto." />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {list.map((product) => (
              <li key={product.productId} className="flex items-center gap-3 py-3">
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded-card bg-subtle">
                  <img
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
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => pickImage(product.productId)}
                    loading={rowBusy === product.productId}
                    aria-label={`Trocar imagem de ${product.productName}`}
                  >
                    <FiImage size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(product.productId)}
                    aria-label={`Editar ${product.productName}`}
                  >
                    <FiEdit2 size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.productId)}
                    loading={rowBusy === product.productId}
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageSelected}
      />
    </div>
  );
}

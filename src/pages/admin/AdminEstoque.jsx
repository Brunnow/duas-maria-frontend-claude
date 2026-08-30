import { useCallback, useState } from 'react';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { useFetch } from '@/hooks/useFetch';
import * as adminService from '@/services/adminService';

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único'];
const errText = (err, fallback) => err?.response?.data?.message || fallback;

const fetchProductList = () =>
  adminService.listProducts({ pageSize: 200 }).then((data) => data.content || []);

export default function AdminEstoque() {
  const { data: products } = useFetch(fetchProductList, []);
  const productOptions = products || [];

  const [productId, setProductId] = useState('');

  const variantsFetcher = useCallback(
    () => (productId ? adminService.getVariants(productId) : Promise.resolve([])),
    [productId],
  );
  const {
    status: variantsStatus,
    data: variantsData,
    refetch: refetchVariants,
  } = useFetch(variantsFetcher, [productId]);
  const variants = variantsData || [];

  const [busyVariant, setBusyVariant] = useState(null);
  const [notice, setNotice] = useState(null);
  const [newSize, setNewSize] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [addingSize, setAddingSize] = useState(false);

  const run = async (variantId, fn) => {
    setBusyVariant(variantId);
    setNotice(null);
    try {
      await fn();
      refetchVariants();
    } catch (err) {
      setNotice(errText(err, 'A operação falhou.'));
    } finally {
      setBusyVariant(null);
    }
  };

  const adjust = (variantId, type) =>
    run(variantId, () =>
      adminService.registerMovement(productId, variantId, { type, quantity: 1 }),
    );

  const recount = (variantId) => {
    const input = window.prompt('Novo estoque (contagem de inventário):');
    if (input == null) return;
    const value = Number(input);
    if (!Number.isInteger(value) || value < 0) {
      setNotice('Informe um número inteiro maior ou igual a zero.');
      return;
    }
    run(variantId, () =>
      adminService.recountStock(productId, variantId, value, 'Recontagem via painel'),
    );
  };

  const removeVariant = (variantId) => {
    if (!window.confirm('Remover esta variação? (o estoque precisa estar zerado)')) return;
    run(variantId, () => adminService.deleteVariant(productId, variantId));
  };

  const handleAddSize = async (event) => {
    event.preventDefault();
    if (!newSize) return;
    const stock = Number(newStock);
    if (!Number.isInteger(stock) || stock < 0) {
      setNotice('Estoque inicial inválido.');
      return;
    }
    setAddingSize(true);
    setNotice(null);
    try {
      await adminService.createVariants(productId, [{ size: newSize, initialStock: stock }]);
      setNewSize('');
      setNewStock('0');
      refetchVariants();
    } catch (err) {
      setNotice(errText(err, 'Não foi possível adicionar o tamanho.'));
    } finally {
      setAddingSize(false);
    }
  };

  const usedSizes = new Set(variants.map((v) => v.size));
  // Regra do backend: "Único" so quando o produto nao tem nenhum tamanho;
  // tamanhos numerados so quando nao existe "Único".
  const availableSizes = usedSizes.has('Único')
    ? []
    : SIZES.filter((s) => !usedSizes.has(s) && (s !== 'Único' || variants.length === 0));

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Estoque</h2>

      <div className="mt-4 max-w-sm">
        <Select label="Produto" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Selecione…</option>
          {productOptions.map((p) => (
            <option key={p.productId} value={p.productId}>
              {p.productName}
            </option>
          ))}
        </Select>
      </div>

      {notice && (
        <p role="status" className="mt-3 text-sm text-danger">
          {notice}
        </p>
      )}

      {productId && (
        <div className="mt-6">
          {variantsStatus === 'loading' ? (
            <Skeleton className="h-40" />
          ) : (
            <>
              {variants.length === 0 ? (
                <p className="text-sm text-muted">
                  Este produto ainda não tem grade de tamanhos. Adicione ao menos um abaixo para
                  deixá-lo à venda.
                </p>
              ) : (
                <ul className="divide-y divide-border border-y border-border">
                  {variants.map((variant) => (
                    <li key={variant.variantId} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">Tamanho {variant.size}</p>
                        <p className="text-xs text-muted">
                          {variant.sku} · estoque{' '}
                          <span
                            className={
                              variant.stock === 0 ? 'font-medium text-danger' : 'text-foreground'
                            }
                          >
                            {variant.stock}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adjust(variant.variantId, 'LOSS')}
                          loading={busyVariant === variant.variantId}
                          aria-label={`Baixa de 1 no tamanho ${variant.size}`}
                        >
                          <FiMinus size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => adjust(variant.variantId, 'RETURN')}
                          loading={busyVariant === variant.variantId}
                          aria-label={`Entrada de 1 no tamanho ${variant.size}`}
                        >
                          <FiPlus size={14} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => recount(variant.variantId)}
                          loading={busyVariant === variant.variantId}
                        >
                          Recontar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.variantId)}
                          loading={busyVariant === variant.variantId}
                          aria-label={`Remover tamanho ${variant.size}`}
                        >
                          <FiTrash2 size={14} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {availableSizes.length > 0 && (
                <form onSubmit={handleAddSize} className="mt-5 flex flex-wrap items-end gap-3">
                  <div className="w-32">
                    <Select
                      label="Adicionar tamanho"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                    >
                      <option value="">…</option>
                      {availableSizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-28">
                    <Input
                      label="Estoque inicial"
                      type="number"
                      min="0"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                    />
                  </div>
                  <Button type="submit" loading={addingSize} disabled={!newSize}>
                    Adicionar
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

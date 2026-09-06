import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import StockMovementModal from '@/components/admin/StockMovementModal';
import { VARIANT_SIZES, sizeRank } from '@/lib/variants';
import * as adminService from '@/services/adminService';

const LOW_STOCK = 3; // mesmo threshold padrão do backend em /admin/stock/low
const errText = (err, fallback) => err?.response?.data?.message || fallback;

function stockBadge(stock) {
  if (stock <= 0) return { tone: 'danger', label: 'Esgotado' };
  if (stock <= LOW_STOCK) return { tone: 'warning', label: `Baixo · ${stock}` };
  return { tone: 'success', label: String(stock) };
}

/*
 * Painel de tamanhos e estoque de UM produto. Reaproveitado pela tela de
 * produto (AdminProdutos) e pela tela de estoque (AdminEstoque).
 *
 * NÃO calcula estoque: toda operação chama os endpoints existentes, que
 * escrevem via StockService.
 */
export default function ProductVariantsManager({ productId, onClose }) {
  const [variants, setVariants] = useState(null); // null = carregando
  const [busy, setBusy] = useState(null); // 'add' | variantId
  const [error, setError] = useState(null);

  const [newSize, setNewSize] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [recountFor, setRecountFor] = useState(null); // variantId
  const [recountValue, setRecountValue] = useState('');
  const [movementFor, setMovementFor] = useState(null); // variant object

  const load = () =>
    adminService
      .getVariants(productId)
      .then((list) => setVariants([...list].sort((a, b) => sizeRank(a.size) - sizeRank(b.size))))
      .catch((err) => setError(errText(err, 'Não foi possível carregar os tamanhos.')));

  // Recomendado montar com key={productId} nos pontos de uso, para o estado
  // local (recontagem em aberto, etc.) reiniciar ao trocar de produto.
  useEffect(() => {
    let alive = true;
    adminService
      .getVariants(productId)
      .then((list) => {
        if (alive) {
          setVariants([...list].sort((a, b) => sizeRank(a.size) - sizeRank(b.size)));
        }
      })
      .catch((err) => {
        if (alive) setError(errText(err, 'Não foi possível carregar os tamanhos.'));
      });
    return () => {
      alive = false;
    };
  }, [productId]);

  const run = async (key, fn) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(errText(err, 'Não foi possível concluir a operação.'));
    } finally {
      setBusy(null);
    }
  };

  const list = variants || [];
  const usedSizes = new Set(list.map((v) => v.size));
  const hasUnico = usedSizes.has('Único');
  const availableSizes = hasUnico
    ? []
    : VARIANT_SIZES.filter((s) => !usedSizes.has(s) && (s !== 'Único' || list.length === 0));

  const handleAdd = (event) => {
    event.preventDefault();
    const stock = Number(newStock);
    if (!newSize) return;
    if (!Number.isInteger(stock) || stock < 0) {
      setError('Estoque inicial inválido.');
      return;
    }
    run('add', () =>
      adminService.createVariants(productId, [{ size: newSize, initialStock: stock }]),
    ).then(() => {
      setNewSize('');
      setNewStock('0');
    });
  };

  const submitRecount = (variantId) => {
    const value = Number(recountValue);
    if (!Number.isInteger(value) || value < 0) {
      setError('Informe um número inteiro maior ou igual a zero.');
      return;
    }
    run(variantId, () =>
      adminService.recountStock(productId, variantId, value, 'Recontagem via painel'),
    ).then(() => {
      setRecountFor(null);
      setRecountValue('');
    });
  };

  const submitMovement = (body) => {
    setError(null);
    return adminService.registerMovement(productId, movementFor.variantId, body).then(() => {
      setMovementFor(null);
      return load();
    });
  };

  return (
    <div className="rounded-card border border-border p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg text-foreground">Tamanhos e estoque</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4">
        {variants === null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted">
            Este produto ainda não tem grade de tamanhos. Adicione ao menos um abaixo para deixá-lo
            à venda.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {list.map((variant) => {
              const badge = stockBadge(variant.stock ?? 0);
              const isBusy = busy === variant.variantId;
              return (
                <li key={variant.variantId} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        Tamanho {variant.size}{' '}
                        <Badge tone={badge.tone} className="ml-1">
                          {badge.label}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted">{variant.sku}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRecountFor(variant.variantId);
                          setRecountValue(String(variant.stock ?? 0));
                        }}
                        disabled={isBusy}
                      >
                        Recontar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setMovementFor(variant)}
                        disabled={isBusy}
                      >
                        Movimentar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          run(variant.variantId, () =>
                            adminService.deleteVariant(productId, variant.variantId),
                          )
                        }
                        loading={isBusy}
                        aria-label={`Remover tamanho ${variant.size}`}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>

                  {recountFor === variant.variantId && (
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div className="w-32">
                        <Input
                          label="Novo estoque"
                          type="number"
                          min="0"
                          value={recountValue}
                          onChange={(e) => setRecountValue(e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        loading={isBusy}
                        onClick={() => submitRecount(variant.variantId)}
                      >
                        Confirmar recontagem
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRecountFor(null)}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {availableSizes.length > 0 && (
          <form onSubmit={handleAdd} className="mt-5 flex flex-wrap items-end gap-3">
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
            <Button type="submit" loading={busy === 'add'} disabled={!newSize}>
              Adicionar
            </Button>
          </form>
        )}
      </div>

      <StockMovementModal
        open={movementFor != null}
        variant={movementFor}
        submitting={busy === 'movement'}
        onClose={() => setMovementFor(null)}
        onSubmit={submitMovement}
      />
    </div>
  );
}

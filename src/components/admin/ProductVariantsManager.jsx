import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import ColorSwatch from '@/components/shared/ColorSwatch';
import ColorFields from '@/components/admin/ColorFields';
import StockMovementModal from '@/components/admin/StockMovementModal';
import VariantGridInput from '@/components/admin/VariantGridInput';
import {
  SIZE_GROUPS,
  UNICO,
  VARIANT_SIZES,
  groupByColor,
  hasColors,
  sameColor,
  sizeRank,
  toGridPayload,
} from '@/lib/variants';
import { colorFieldsValue, colorPayload } from '@/lib/colors';
import * as adminService from '@/services/adminService';

const LOW_STOCK = 3; // mesmo threshold padrão do backend em /admin/stock/low
const errText = (err, fallback) => err?.response?.data?.message || fallback;

function stockBadge(stock) {
  if (stock <= 0) return { tone: 'danger', label: 'Esgotado' };
  if (stock <= LOW_STOCK) return { tone: 'warning', label: `Baixo · ${stock}` };
  return { tone: 'success', label: String(stock) };
}

const bySize = (list) => [...list].sort((a, b) => sizeRank(a.size) - sizeRank(b.size));

/*
 * Painel de tamanhos, cores e estoque de UM produto. Reaproveitado pela tela
 * de produto (AdminProdutos) e pela tela de estoque (AdminEstoque).
 *
 * Produto sem cor: lista de tamanhos, como sempre. Com cor: um bloco por cor
 * (bolinha/miniatura, nome, "Editar cor" e os tamanhos daquela cor).
 * `productColors` (opcional, da listagem) só serve para mostrar a miniatura
 * da foto das cores sem bolinha. `onChanged` avisa quem está em volta (ex.:
 * o painel de fotos) que as cores mudaram.
 *
 * NÃO calcula estoque: toda operação chama os endpoints existentes, que
 * escrevem via StockService.
 */
export default function ProductVariantsManager({ productId, productColors, onClose, onChanged }) {
  const [variants, setVariants] = useState(null); // null = carregando
  const [busy, setBusy] = useState(null); // 'add' | 'color' | variantId
  const [error, setError] = useState(null);

  const [recountFor, setRecountFor] = useState(null); // variantId
  const [recountValue, setRecountValue] = useState('');
  const [movementFor, setMovementFor] = useState(null); // variant object
  const [editingColor, setEditingColor] = useState(null); // nome da cor em edição
  const [addingColor, setAddingColor] = useState(false);
  const [deletingColor, setDeletingColor] = useState(null); // grupo aguardando confirmação

  const load = () =>
    adminService
      .getVariants(productId)
      .then((list) => setVariants(bySize(list)))
      .catch((err) => setError(errText(err, 'Não foi possível carregar os tamanhos.')));

  // Recomendado montar com key={productId} nos pontos de uso, para o estado
  // local (recontagem em aberto, etc.) reiniciar ao trocar de produto.
  useEffect(() => {
    let alive = true;
    adminService
      .getVariants(productId)
      .then((list) => {
        if (alive) setVariants(bySize(list));
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
      onChanged?.();
      return true;
    } catch (err) {
      setError(errText(err, 'Não foi possível concluir a operação.'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const list = variants || [];
  const colored = hasColors(list);
  const groups = groupByColor(list);

  const submitRecount = (variantId) => {
    const value = Number(recountValue);
    if (!Number.isInteger(value) || value < 0) {
      setError('Informe um número inteiro maior ou igual a zero.');
      return;
    }
    run(variantId, () =>
      adminService.recountStock(productId, variantId, value, 'Recontagem via painel'),
    ).then((ok) => {
      if (!ok) return;
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

  const renderVariant = (variant) => {
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
              aria-label={
                variant.color
                  ? `Remover tamanho ${variant.size} da cor ${variant.color}`
                  : `Remover tamanho ${variant.size}`
              }
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
            <Button size="sm" loading={isBusy} onClick={() => submitRecount(variant.variantId)}>
              Confirmar recontagem
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRecountFor(null)}>
              Cancelar
            </Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="rounded-card border border-border p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg text-foreground">
          {colored ? 'Cores, tamanhos e estoque' : 'Tamanhos e estoque'}
        </h3>
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
        ) : colored ? (
          <div className="flex flex-col gap-5">
            {groups.map((group) => (
              <section
                key={group.color}
                aria-label={`Cor ${group.color}`}
                className="rounded-card border border-border p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <ColorSwatch
                    name={group.color}
                    hex={group.colorHex}
                    image={productColors?.find((c) => sameColor(c.name, group.color))?.image}
                  />
                  <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                    {group.color}
                  </p>
                  {editingColor !== group.color && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingColor(group.color)}
                        aria-label={`Editar cor ${group.color}`}
                      >
                        Editar cor
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingColor(group)}
                        aria-label={`Excluir cor ${group.color}`}
                        className="text-danger hover:text-danger"
                      >
                        Excluir cor
                      </Button>
                    </div>
                  )}
                </div>

                {editingColor === group.color && (
                  <EditColorForm
                    group={group}
                    busy={busy === 'color'}
                    onCancel={() => setEditingColor(null)}
                    onSubmit={(value) =>
                      run('color', () =>
                        adminService.renameColor(productId, {
                          currentName: group.color,
                          ...colorPayload(value),
                        }),
                      ).then((ok) => ok && setEditingColor(null))
                    }
                  />
                )}

                <ul className="mt-3 divide-y divide-border border-y border-border">
                  {group.variants.map(renderVariant)}
                </ul>

                <AddSizeForm
                  key={`add-${group.color}`}
                  usedSizes={group.variants.map((v) => v.size)}
                  busy={busy === `add-${group.color}`}
                  idSuffix={` (${group.color})`}
                  onSubmit={(item) =>
                    run(`add-${group.color}`, () =>
                      adminService.createVariants(productId, [item], { color: group.color }),
                    )
                  }
                />
              </section>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {list.map(renderVariant)}
          </ul>
        )}

        {variants !== null && !colored && (
          <AddSizeForm
            usedSizes={list.map((v) => v.size)}
            busy={busy === 'add'}
            onSubmit={(item) => run('add', () => adminService.createVariants(productId, [item]))}
          />
        )}

        {variants !== null &&
          (addingColor ? (
            <AddColorForm
              needsCurrentName={list.length > 0 && !colored}
              existingColors={groups.map((g) => g.color).filter(Boolean)}
              busy={busy === 'new-color'}
              onCancel={() => setAddingColor(false)}
              onSubmit={({ current, next, grid }) =>
                run('new-color', async () => {
                  if (current) {
                    await adminService.renameColor(productId, {
                      currentName: '',
                      ...colorPayload(current),
                    });
                  }
                  const { name, hex } = colorPayload(next);
                  await adminService.createVariants(productId, grid, {
                    color: name,
                    colorHex: hex,
                  });
                }).then((ok) => ok && setAddingColor(false))
              }
            />
          ) : (
            <div className="mt-5">
              <Button variant="secondary" size="sm" onClick={() => setAddingColor(true)}>
                {colored ? 'Adicionar outra cor' : 'Adicionar cor'}
              </Button>
              {!colored && (
                <p className="mt-1.5 text-xs text-muted">
                  Para vender este modelo em mais de uma cor, sem criar outro produto.
                </p>
              )}
            </div>
          ))}
      </div>

      <ConfirmDialog
        open={deletingColor != null}
        title={deletingColor ? `Excluir a cor ${deletingColor.color}?` : ''}
        description={deletingColor ? deleteColorText(deletingColor) : ''}
        confirmLabel="Excluir cor"
        errorFallback="Não foi possível excluir a cor."
        onClose={() => setDeletingColor(null)}
        onConfirm={async () => {
          // Erro sobe para o diálogo, que mostra a mensagem do backend (ex.: tamanho vendido).
          await adminService.deleteColor(productId, deletingColor.color);
          await load();
          onChanged?.();
        }}
      />

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

function deleteColorText(group) {
  const sizes = group.variants.map((v) => v.size).join(', ');
  const stock = group.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  return (
    `Saem da loja os tamanhos ${sizes}` +
    (stock > 0 ? ` (${stock} ${stock === 1 ? 'peça' : 'peças'} em estoque)` : '') +
    ' e as fotos desta cor. Não dá para desfazer.'
  );
}

/** Adicionar UM tamanho (a uma cor, ou ao produto sem cor). */
function AddSizeForm({ usedSizes, busy, onSubmit, idSuffix = '' }) {
  const [size, setSize] = useState('');
  const [stock, setStock] = useState('0');
  const [error, setError] = useState(null);

  const used = new Set(usedSizes);
  const hasUnico = used.has(UNICO);
  const available = hasUnico
    ? []
    : VARIANT_SIZES.filter((s) => !used.has(s) && (s !== UNICO || usedSizes.length === 0));
  if (available.length === 0) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const initialStock = Number(stock);
    if (!size) return;
    if (!Number.isInteger(initialStock) || initialStock < 0) {
      setError('Estoque inicial inválido.');
      return;
    }
    setError(null);
    Promise.resolve(onSubmit({ size, initialStock })).then((ok) => {
      if (ok === false) return;
      setSize('');
      setStock('0');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
      <div className="w-32">
        <Select
          label="Adicionar tamanho"
          aria-label={idSuffix ? `Adicionar tamanho${idSuffix}` : undefined}
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="">…</option>
          {SIZE_GROUPS.map((group) => {
            const sizes = group.sizes.filter((s) => available.includes(s));
            if (sizes.length === 0) return null;
            return (
              <optgroup key={group.label} label={group.label}>
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </Select>
      </div>
      <div className="w-28">
        <Input
          label="Estoque inicial"
          aria-label={idSuffix ? `Estoque inicial${idSuffix}` : undefined}
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>
      <Button type="submit" loading={busy} disabled={!size}>
        Adicionar
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

function EditColorForm({ group, busy, onCancel, onSubmit }) {
  const [value, setValue] = useState(() => colorFieldsValue(group.color, group.colorHex));
  const [error, setError] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.name.trim()) {
      setError('Informe o nome da cor.');
      return;
    }
    onSubmit(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-3 rounded-control bg-subtle p-3"
    >
      <ColorFields value={value} onChange={setValue} error={error} />
      <p className="text-xs text-muted">As fotos desta cor acompanham o novo nome.</p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>
          Salvar cor
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/**
 * Nova cor com a sua grade. Num produto que já tinha tamanhos sem cor, pede
 * também o nome da cor atual (as fotos que ele já tem passam a ser dela).
 */
function AddColorForm({ needsCurrentName, existingColors, busy, onCancel, onSubmit }) {
  const [current, setCurrent] = useState(() => colorFieldsValue());
  const [next, setNext] = useState(() => colorFieldsValue());
  const [grid, setGrid] = useState({});
  const [errors, setErrors] = useState({});

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = {};
    const currentName = current.name.trim();
    const nextName = next.name.trim();
    if (needsCurrentName && !currentName) found.current = 'Informe a cor atual do produto.';
    if (!nextName) found.next = 'Informe o nome da nova cor.';
    else if (
      existingColors.some((c) => sameColor(c, nextName)) ||
      (needsCurrentName && sameColor(currentName, nextName))
    ) {
      found.next = 'O produto já tem essa cor.';
    }
    const items = toGridPayload(grid);
    if (items.length === 0) found.grid = 'Marque ao menos um tamanho da nova cor.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ current: needsCurrentName ? current : null, next, grid: items });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Adicionar cor"
      className="mt-5 flex flex-col gap-5 rounded-card border border-border p-4"
    >
      {needsCurrentName && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">Cor atual deste produto</p>
          <p className="text-xs text-muted">
            Os tamanhos e as fotos que ele já tem passam a ser desta cor.
          </p>
          <ColorFields
            label="Cor atual"
            value={current}
            onChange={setCurrent}
            error={errors.current}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">Nova cor</p>
        <ColorFields label="Nome da nova cor" value={next} onChange={setNext} error={errors.next} />
      </div>

      <div>
        <VariantGridInput value={grid} onChange={setGrid} legend="Tamanhos e estoque da nova cor" />
        {errors.grid && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {errors.grid}
          </p>
        )}
      </div>

      <p className="text-xs text-muted">
        Depois de salvar, envie as fotos da nova cor em “Imagens” e escolha a cor delas.
      </p>

      <div className="flex gap-2">
        <Button type="submit" loading={busy}>
          Salvar cor
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

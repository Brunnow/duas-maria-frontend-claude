import { useEffect, useRef, useState } from 'react';
import { FiArrowDown, FiArrowUp, FiStar, FiTrash2, FiUpload } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import ColorSwatch from '@/components/shared/ColorSwatch';
import { groupByColor, hasColors, sameColor } from '@/lib/variants';
import * as adminService from '@/services/adminService';

const MAX_IMAGES = 8; // por cor (ou do produto todo, quando ele não tem cor) — ProductImageServiceImpl
const errText = (err, fallback) => err?.response?.data?.message || fallback;

/*
 * Painel de galeria de um produto. Cada operação do backend devolve a
 * lista final de imagens, então é só guardar o retorno.
 *
 * Produto com cores: escolhe a cor antes de enviar e cada foto mostra a sua
 * cor (dá para trocar). "Todas as cores" = a foto aparece em qualquer cor.
 */
export default function ProductImagesManager({ productId, onClose }) {
  const [images, setImages] = useState(null); // null = carregando
  const [busy, setBusy] = useState(null); // 'upload' | imageId
  const [error, setError] = useState(null);
  const [colors, setColors] = useState([]); // [{ color, colorHex }] — vazio = produto sem cor
  const [uploadColor, setUploadColor] = useState(null); // null = ainda não escolhida
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    adminService
      .listProductImages(productId)
      .then((list) => alive && setImages(list))
      .catch((err) => alive && setError(errText(err, 'Não foi possível carregar as imagens.')));
    // As cores vêm das variações; se falhar, o painel funciona como produto sem cor.
    Promise.resolve()
      .then(() => adminService.getVariants(productId))
      .then((variants) => {
        if (alive && hasColors(variants)) setColors(groupByColor(variants));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [productId]);

  const colored = colors.length > 0;
  // Cor das próximas fotos: a escolhida, ou a primeira cor do produto.
  const targetColor = uploadColor ?? (colored ? colors[0].color : '');
  const countFor = (color) =>
    (images || []).filter((i) => (color ? sameColor(i.color, color) : !i.color)).length;
  const full = colored ? countFor(targetColor) >= MAX_IMAGES : (images?.length ?? 0) >= MAX_IMAGES;

  const run = async (key, fn) => {
    setBusy(key);
    setError(null);
    try {
      setImages(await fn());
    } catch (err) {
      setError(errText(err, 'Não foi possível concluir a operação.'));
    } finally {
      setBusy(null);
    }
  };

  const handleUpload = (event) => {
    // Copiar os File para um array ANTES de limpar o input: no navegador,
    // event.target.value = '' esvazia a FileList original (a referência é viva).
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    run('upload', () =>
      colored && targetColor
        ? adminService.uploadProductImages(productId, files, targetColor)
        : adminService.uploadProductImages(productId, files),
    );
  };

  const move = (index, dir) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    run(images[index].imageId, () =>
      adminService.reorderProductImages(
        productId,
        next.map((i) => i.imageId),
      ),
    );
  };

  return (
    <div className="rounded-card border border-border p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg text-foreground">Imagens do produto</h3>
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
        {images === null ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="aspect-[3/4]" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma imagem ainda. Envie a primeira abaixo.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, index) => (
              <li key={img.imageId} className="overflow-hidden rounded-card border border-border">
                <div className="relative aspect-[3/4] bg-subtle">
                  <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
                  {img.primary && (
                    <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-fg">
                      Principal
                    </span>
                  )}
                </div>
                {colored && (
                  <div className="border-t border-border px-1.5 pt-1.5">
                    <select
                      aria-label={`Cor da foto ${index + 1}`}
                      value={colors.find((c) => sameColor(c.color, img.color))?.color ?? ''}
                      disabled={busy != null}
                      onChange={(e) =>
                        run(img.imageId, () =>
                          adminService.setProductImageColor(productId, img.imageId, e.target.value),
                        )
                      }
                      className="w-full rounded-control border border-border bg-surface px-1 py-1 text-xs text-foreground"
                    >
                      <option value="">Todas as cores</option>
                      {colors.map((c) => (
                        <option key={c.color} value={c.color}>
                          {c.color}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <button
                    type="button"
                    title="Tornar principal"
                    aria-label="Tornar principal"
                    disabled={img.primary || busy != null}
                    onClick={() =>
                      run(img.imageId, () =>
                        adminService.setPrimaryProductImage(productId, img.imageId),
                      )
                    }
                    className="text-muted hover:text-accent disabled:opacity-30"
                  >
                    <FiStar size={15} />
                  </button>
                  <button
                    type="button"
                    title="Mover para trás"
                    aria-label="Mover para trás"
                    disabled={index === 0 || busy != null}
                    onClick={() => move(index, -1)}
                    className="text-muted hover:text-foreground disabled:opacity-30"
                  >
                    <FiArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    title="Mover para frente"
                    aria-label="Mover para frente"
                    disabled={index === images.length - 1 || busy != null}
                    onClick={() => move(index, 1)}
                    className="text-muted hover:text-foreground disabled:opacity-30"
                  >
                    <FiArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    title="Excluir"
                    aria-label="Excluir imagem"
                    disabled={busy != null}
                    onClick={() =>
                      run(img.imageId, () =>
                        adminService.deleteProductImage(productId, img.imageId),
                      )
                    }
                    className="text-muted hover:text-danger disabled:opacity-30"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
        {colored && (
          <div className="flex items-end gap-2">
            <ColorSwatch
              name={targetColor}
              hex={colors.find((c) => sameColor(c.color, targetColor))?.colorHex}
              className="mb-1.5"
            />
            <div className="w-44">
              <Select
                label="Cor das fotos"
                value={targetColor}
                onChange={(e) => setUploadColor(e.target.value)}
              >
                {colors.map((c) => (
                  <option key={c.color} value={c.color}>
                    {c.color}
                  </option>
                ))}
                <option value="">Todas as cores</option>
              </Select>
            </div>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          loading={busy === 'upload'}
          disabled={busy != null || full}
          onClick={() => fileRef.current?.click()}
        >
          <FiUpload size={15} />
          Enviar imagens
        </Button>
        <span className="text-xs text-muted">
          {colored ? countFor(targetColor) : (images?.length ?? 0)}/{MAX_IMAGES}
          {colored && (targetColor ? ` em ${targetColor}` : ' em todas as cores')} · JPG, PNG, WEBP
          ou GIF (até 5 MB cada)
        </span>
      </div>
    </div>
  );
}

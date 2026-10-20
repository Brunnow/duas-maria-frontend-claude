import { useEffect, useMemo, useRef, useState } from 'react';
import { FiTrash2, FiUpload } from 'react-icons/fi';
import Button from '@/components/ui/Button';

const MAX_PHOTOS = 8; // por cor (ou do produto sem cor) — ProductImageServiceImpl.MAX_IMAGES
const MAX_BYTES = 5 * 1024 * 1024; // ImageValidation.MAX_BYTES

/**
 * Escolha de fotos ANTES de o produto existir: guarda os arquivos e mostra a
 * prévia; o envio acontece no "Criar produto". Recusa aqui o que o backend
 * recusaria (não imagem, acima de 5 MB, mais de 8), para não falhar no meio.
 * Com `markFirst`, a primeira foto aparece como a principal do produto.
 */
export default function PhotoPicker({ files, onChange, label = 'Fotos', markFirst = true }) {
  const inputRef = useRef(null);
  const [warning, setWarning] = useState(null);

  // createObjectURL não existe em alguns ambientes (testes): sem prévia, só o nome.
  const canPreview = typeof URL.createObjectURL === 'function';
  const previews = useMemo(
    () => files.map((file) => (canPreview ? URL.createObjectURL(file) : '')),
    [files, canPreview],
  );
  useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews]);

  const handlePick = (event) => {
    // Copiar antes de limpar o input: o value = '' esvazia a FileList original.
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    const notImage = picked.filter((f) => !f.type.startsWith('image/'));
    const tooBig = picked.filter((f) => f.type.startsWith('image/') && f.size > MAX_BYTES);
    const ok = picked.filter((f) => f.type.startsWith('image/') && f.size <= MAX_BYTES);
    const room = MAX_PHOTOS - files.length;
    const accepted = ok.slice(0, Math.max(0, room));

    const notes = [];
    if (tooBig.length) notes.push(`${tooBig.map((f) => f.name).join(', ')}: acima de 5 MB.`);
    if (notImage.length) notes.push(`${notImage.map((f) => f.name).join(', ')}: não é imagem.`);
    if (ok.length > accepted.length) notes.push(`Máximo de ${MAX_PHOTOS} fotos aqui.`);
    setWarning(notes.length ? notes.join(' ') : null);
    if (accepted.length) onChange([...files, ...accepted]);
  };

  const remove = (index) => {
    setWarning(null);
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      {files.length > 0 && (
        <ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="relative overflow-hidden rounded-card border border-border"
            >
              {previews[index] ? (
                <img src={previews[index]} alt="" className="aspect-[3/4] w-full object-cover" />
              ) : (
                <span className="flex aspect-[3/4] w-full items-center justify-center p-1 text-center text-[10px] text-muted">
                  {file.name}
                </span>
              )}
              {markFirst && index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-accent px-1 py-0.5 text-[9px] font-semibold uppercase text-accent-fg">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Tirar a foto ${file.name}`}
                className="absolute right-1 top-1 rounded-full bg-surface/90 p-1 text-muted hover:text-danger"
              >
                <FiTrash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          aria-label={label}
          onChange={handlePick}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={files.length >= MAX_PHOTOS}
          onClick={() => inputRef.current?.click()}
        >
          <FiUpload size={15} />
          Escolher fotos
        </Button>
        <span className="text-xs text-muted">
          {files.length}/{MAX_PHOTOS} · até 5 MB cada · sobem ao criar o produto
        </span>
      </div>
      {warning && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {warning}
        </p>
      )}
    </div>
  );
}

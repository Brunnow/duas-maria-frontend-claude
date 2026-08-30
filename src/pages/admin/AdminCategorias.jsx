import { useCallback, useState } from 'react';
import { FiCheck, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import api from '@/api/api';
import { useFetch } from '@/hooks/useFetch';
import * as adminService from '@/services/adminService';

const errText = (err, fallback) => err?.response?.data?.message || fallback;
const isValidName = (name) => name.trim().length >= 5;

const fetchCategoriesList = () =>
  api.get('/public/categories').then((res) => res.data.content || []);

export default function AdminCategorias() {
  const { status, data, error, refetch } = useFetch(fetchCategoriesList, []);
  const list = data || [];

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const run = useCallback(
    async (fn) => {
      setBusy(true);
      setNotice(null);
      try {
        await fn();
        refetch();
        return true;
      } catch (err) {
        setNotice(errText(err, 'A operação falhou.'));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refetch],
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!isValidName(newName)) {
      setNotice('O nome da categoria precisa ter ao menos 5 caracteres.');
      return;
    }
    if (await run(() => adminService.createCategory(newName.trim()))) setNewName('');
  };

  const startEdit = (category) => {
    setEditingId(category.categoryId);
    setEditName(category.categoryName);
  };

  const handleRename = async (categoryId) => {
    if (!isValidName(editName)) {
      setNotice('O nome da categoria precisa ter ao menos 5 caracteres.');
      return;
    }
    if (await run(() => adminService.updateCategory(categoryId, editName.trim()))) {
      setEditingId(null);
    }
  };

  const handleDelete = (categoryId) => {
    if (!window.confirm('Excluir esta categoria?')) return;
    run(() => adminService.deleteCategory(categoryId));
  };

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Categorias</h2>

      <form onSubmit={handleCreate} className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Nova categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="mín. 5 caracteres"
          />
        </div>
        <Button type="submit" loading={busy} disabled={!isValidName(newName)}>
          Adicionar
        </Button>
      </form>

      {notice && (
        <p role="status" className="mt-3 text-sm text-muted">
          {notice}
        </p>
      )}

      <div className="mt-5">
        {status === 'loading' ? (
          <Skeleton className="h-32" />
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
          <EmptyState title="Nenhuma categoria" />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {list.map((category) => (
              <li key={category.categoryId} className="flex items-center gap-3 py-3">
                {editingId === category.categoryId ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      aria-label="Nome da categoria"
                      className="h-9 flex-1 rounded-control border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRename(category.categoryId)}
                      loading={busy}
                      aria-label="Salvar"
                    >
                      <FiCheck size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancelar"
                    >
                      <FiX size={15} />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">{category.categoryName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(category)}
                      aria-label={`Renomear ${category.categoryName}`}
                    >
                      <FiEdit2 size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.categoryId)}
                      aria-label={`Excluir ${category.categoryName}`}
                    >
                      <FiTrash2 size={15} />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

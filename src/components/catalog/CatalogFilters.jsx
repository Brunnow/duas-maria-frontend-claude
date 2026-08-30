import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import SearchField from './SearchField';

const groupTitle = 'mb-3 text-xs font-semibold uppercase tracking-wider text-foreground';

/**
 * Controles de filtro do catalogo (apresentacional). Usado tanto na
 * sidebar do desktop quanto no drawer do mobile.
 */
export default function CatalogFilters({
  categories,
  category,
  sort,
  keyword,
  onCategory,
  onSort,
  onKeyword,
  onClear,
  hasActiveFilters,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className={groupTitle}>Buscar</h2>
        <SearchField value={keyword} onSearch={onKeyword} />
      </div>

      <div>
        <h2 className={groupTitle}>Categoria</h2>
        <Select
          value={category}
          onChange={(event) => onCategory(event.target.value)}
          aria-label="Categoria"
        >
          <option value="">Todas</option>
          {categories.map((item) => (
            <option key={item.categoryId} value={item.categoryName}>
              {item.categoryName}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <h2 className={groupTitle}>Ordenar por</h2>
        <Select
          value={sort}
          onChange={(event) => onSort(event.target.value)}
          aria-label="Ordenar por"
        >
          <option value="asc">Menor preço</option>
          <option value="desc">Maior preço</option>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="self-start">
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

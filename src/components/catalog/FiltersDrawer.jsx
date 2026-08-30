import Drawer from '@/components/ui/Drawer';
import CatalogFilters from './CatalogFilters';

/** CatalogFilters dentro de um drawer lateral, para telas pequenas. */
export default function FiltersDrawer({ open, onClose, ...filterProps }) {
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Filtros">
      <CatalogFilters {...filterProps} />
    </Drawer>
  );
}

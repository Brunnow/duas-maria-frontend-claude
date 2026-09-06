import { useState } from 'react';
import Select from '@/components/ui/Select';
import { useFetch } from '@/hooks/useFetch';
import ProductVariantsManager from '@/components/admin/ProductVariantsManager';
import * as adminService from '@/services/adminService';

const fetchProductList = () =>
  adminService.listProducts({ pageSize: 200 }).then((data) => data.content || []);

/*
 * Visão de estoque por produto. A gestão da grade (tamanhos, estoque,
 * movimentações) é o mesmo componente usado na tela de produto —
 * aqui só escolhemos qual produto.
 */
export default function AdminEstoque() {
  const { data: products } = useFetch(fetchProductList, []);
  const [productId, setProductId] = useState('');

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Estoque</h2>

      <div className="mt-4 max-w-sm">
        <Select label="Produto" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Selecione…</option>
          {(products || []).map((p) => (
            <option key={p.productId} value={p.productId}>
              {p.productName}
            </option>
          ))}
        </Select>
      </div>

      {productId && (
        <div className="mt-6">
          <ProductVariantsManager key={productId} productId={productId} />
        </div>
      )}
    </div>
  );
}

import API from '../../api/api';

export const PRODUCTS_ERROR_MESSAGE =
  'Não conseguimos carregar os produtos agora. Verifique sua conexão e tente de novo.';

// Só a busca mais recente de produtos pode mexer na tela: uma resposta (ou
// falha) atrasada de uma busca anterior não sobrescreve a atual.
let latestProductsRequest = 0;

export const fetchProducts =
  (queryString = '') =>
  async (dispatch) => {
    const requestId = ++latestProductsRequest;
    try {
      dispatch({ type: 'IS_FETCHING' });
      const { data } = await API.get(`/public/products?${queryString}`);
      if (requestId !== latestProductsRequest) return;
      dispatch({
        type: 'FETCH_PRODUCTS',
        payload: data.content,
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        lastPage: data.lastPage,
      });
      dispatch({ type: 'IS_SUCCESS' });
    } catch (error) {
      if (requestId !== latestProductsRequest) return;
      console.log('Error fetching products:', error);
      dispatch({
        type: 'IS_ERROR',
        payload: (error?.response && error.response.data?.message) || PRODUCTS_ERROR_MESSAGE,
      });
    }
  };

export const fetchCategories = () => async (dispatch) => {
  try {
    dispatch({ type: 'CATEGORY_LOADER' });
    const { data } = await API.get(`/public/categories?`);
    dispatch({
      type: 'FETCH_CATEGORIES',
      payload: data.content,
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      lastPage: data.lastPage,
    });
    dispatch({ type: 'CATEGORY_SUCCESS' });
  } catch (error) {
    console.log('Error fetching categories:', error);
    // Erro proprio das categorias: nao pode esconder a lista de produtos,
    // que pode ter carregado normalmente.
    dispatch({
      type: 'CATEGORY_ERROR',
      payload: 'Não conseguimos carregar as categorias.',
    });
  }
};

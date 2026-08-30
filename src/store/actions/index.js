import API  from '../../api/api';

export const fetchProducts  = (queryString = "") => async (dispatch) =>  {
    try {
        dispatch({ type: 'IS_FETCHING' });
        const { data } = await API.get(`/public/products?${queryString}`);
        dispatch({ 
            type: 'FETCH_PRODUCTS', 
            payload: data.content, 
            pageNumber: data.pageNumber,  
            pageSize: data.pageSize, 
            totalElements: data.totalElements, 
            totalPages: data.totalPages, 
            lastPage: data.lastPage, });
            dispatch({ type: 'IS_SUCCESS' });

    } catch (error) {
        console.log('Error fetching products:', error);
        dispatch({ 
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "An error occurred while fetching products."
        });   
    }
}

export const fetchCategories  = () => async (dispatch) =>  {
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
            lastPage: data.lastPage, });
            dispatch({ type: 'CATEGORY_SUCCESS' });

    } catch (error) {
        console.log('Error fetching categories:', error);
        dispatch({
            type: "IS_ERROR",
            payload: error?.response?.data?.message || "An error occurred while fetching category."
        });
    }
}
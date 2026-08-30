import { useState } from 'react';
import { FaShoppingBag } from 'react-icons/fa';
import ProductViewModal from './ProductViewModal';
import { truncateText } from '../utils/truncateText';

const ProductCard = ({
  productId,
  productName,
  image,
  description,
  quantity,
  price,
  discount,
  specialPrice,
}) => {
  const [openProductViewModal, setOpenProductViewModal] = useState(false);
  const bntLoader = false;
  const [selectedViewProduct, setSelectedViewProduct] = useState('');

  const isAvailable = quantity && Number(quantity) > 0;
  const handleProductView = (product) => {
    setSelectedViewProduct(product);
    setOpenProductViewModal(true);
  };

  return (
    <div className="border rounded-lg shadow-xl overflow-hidden transition-shadow duration-300">
      <div
        onClick={() => {
          handleProductView({
            id: productId,
            productName,
            image,
            description,
            quantity,
            price,
            discount,
            specialPrice,
          });
        }}
        className="w-full overflow-hidden aspect-[3/2] "
      >
        <img
          className="w-full h-full cursor-pointer transition-transform duration-300 transform hover:scale-105 "
          src={image}
          alt={productName}
        ></img>
      </div>
      <div className="px-4">
        <h2
          onClick={() => {
            handleProductView({
              id: productId,
              productName,
              image,
              description,
              quantity,
              price,
              discount,
              specialPrice,
            });
          }}
          className="text-lg font-semibold mb-2 cursor-pointer"
        >
          {truncateText(productName, 30)}
        </h2>
        <div className="min-h-20 max-h-20">
          <p className="text-gray-600 text-sm">{truncateText(description, 80)}</p>
        </div>

        <div className="flex items-center justify-between">
          {specialPrice ? (
            <div className="flex flex-col">
              <span className="text-gray-400 line-through">${Number(price).toFixed(2)}</span>
              <span className="text-xl font-bold text-slate-700">
                ${Number(specialPrice).toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-slate-700">
              {'  '}${Number(price).toFixed(2)}
            </span>
          )}

          <button
            disabled={!isAvailable || bntLoader}
            onClick={() => {}}
            className={`${
              isAvailable
                ? 'bg-blue-500 hover:bg-blue-600 opacity-100'
                : 'bg-gray-400 opacity-70 cursor-not-allowed'
            } text-white py-2 px-3 rounded-lg flex items-center justify-center w-36 transition-colors duration-300`}
          >
            <FaShoppingBag className="mr-2 text-lg" />
            <span>{isAvailable ? 'Adicionar' : 'Sem Estoque'}</span>
          </button>
        </div>
      </div>
      <ProductViewModal
        open={openProductViewModal}
        setOpen={setOpenProductViewModal}
        product={selectedViewProduct}
        isAvailable={isAvailable}
      />
    </div>
  );
};

export default ProductCard;

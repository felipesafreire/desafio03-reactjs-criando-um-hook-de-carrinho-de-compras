import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { STORAGE } from '../constants/storage';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem(STORAGE.CART)

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const updatedCart = [...cart]
      const productExistCart = cart.find(product => product.id === productId);
      const productStock = await api.get<Stock>(`/stock/${productId}`);

      const amount = productExistCart ? productExistCart.amount + 1 : 0;

      if (amount > productStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      if (productExistCart) {
        productExistCart.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1
        }

        updatedCart.push(newProduct);

      }

      setCart(updatedCart)
      window.localStorage.setItem(STORAGE.CART, JSON.stringify(updatedCart))

    } catch (e) {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const editCart = [...cart]

      const producIndex = editCart.findIndex(product => product.id === productId)

      if (producIndex === -1) {
        throw Error();
      }

      editCart.splice(producIndex, 1)

      console.log(editCart)

      setCart(editCart)
      window.localStorage.setItem(STORAGE.CART, JSON.stringify(editCart))

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return;
      }

      const productStock = await api.get<Stock>(`/stock/${productId}`);

      if (amount > productStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const updatedCart = [...cart]
      const productExistCart = updatedCart.find(product => product.id === productId);

      if (!productExistCart) {
        throw Error();
      }

      productExistCart.amount = amount;
      setCart(updatedCart);
      window.localStorage.setItem(STORAGE.CART, JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/services/addressService', () => ({
  getUserAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

import * as addressService from '@/services/addressService';
import reducer, {
  clearAddresses,
  fetchAddresses,
  removeAddress,
  saveAddress,
  selectAddresses,
} from './addressSlice';

const makeStore = () => configureStore({ reducer: { address: reducer } });

const A1 = {
  addressId: 1,
  recipientName: 'Maria da Silva',
  phone: '(81) 91234-5678',
  pincode: '50000-000',
  street: 'Rua A',
  number: '10',
  buildingName: 'Casa 1',
  neighborhood: 'Centro',
  city: 'Recife',
  state: 'PE',
};

beforeEach(() => vi.clearAllMocks());

describe('addressSlice', () => {
  it('fetchAddresses: sucesso preenche a lista', async () => {
    addressService.getUserAddresses.mockResolvedValue([A1]);
    const store = makeStore();
    await store.dispatch(fetchAddresses());
    expect(selectAddresses(store.getState())).toEqual([A1]);
    expect(store.getState().address.status).toBe('ready');
  });

  it('fetchAddresses: erro -> status error com mensagem', async () => {
    addressService.getUserAddresses.mockRejectedValue(new Error('x'));
    const store = makeStore();
    await store.dispatch(fetchAddresses());
    expect(store.getState().address.status).toBe('error');
    expect(store.getState().address.error).toMatch(/endereços/i);
  });

  it('saveAddress (novo): chama create e adiciona na lista', async () => {
    addressService.createAddress.mockResolvedValue({ ...A1, addressId: 9 });
    const store = makeStore();
    await store.dispatch(saveAddress({ addressId: null, data: A1 }));
    expect(addressService.createAddress).toHaveBeenCalledWith(A1);
    expect(store.getState().address.items).toHaveLength(1);
  });

  it('saveAddress (existente): chama update e substitui na lista', async () => {
    addressService.getUserAddresses.mockResolvedValue([A1]);
    const store = makeStore();
    await store.dispatch(fetchAddresses());

    addressService.updateAddress.mockResolvedValue({ ...A1, city: 'Olinda' });
    await store.dispatch(saveAddress({ addressId: 1, data: { ...A1, city: 'Olinda' } }));
    expect(addressService.updateAddress).toHaveBeenCalledWith(1, { ...A1, city: 'Olinda' });
    expect(store.getState().address.items[0].city).toBe('Olinda');
  });

  it('removeAddress: retira o endereco da lista', async () => {
    addressService.getUserAddresses.mockResolvedValue([A1]);
    const store = makeStore();
    await store.dispatch(fetchAddresses());

    addressService.deleteAddress.mockResolvedValue('ok');
    await store.dispatch(removeAddress(1));
    expect(store.getState().address.items).toEqual([]);
  });

  it('clearAddresses: reseta o estado', () => {
    const state = reducer({ items: [A1], status: 'ready', error: null }, clearAddresses());
    expect(state.items).toEqual([]);
    expect(state.status).toBe('idle');
  });
});

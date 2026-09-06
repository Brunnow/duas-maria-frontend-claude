import api from '@/api/api';

/*
 * Enderecos do usuario. Contratos reais (AddressController, exige auth):
 *   GET    /api/users/addresses      -> AddressDTO[]  (do usuario logado)
 *   POST   /api/addresses            -> AddressDTO
 *   PUT    /api/addresses/{id}       -> AddressDTO
 *   DELETE /api/addresses/{id}       -> string
 *
 * AddressDTO (endereço brasileiro; validado no backend com mensagens pt-BR):
 *   { addressId, recipientName, phone, pincode (CEP), street (logradouro),
 *     number, buildingName (complemento, opcional), neighborhood (bairro),
 *     city, state (UF), country (opcional — backend assume "Brasil") }
 */

export function getUserAddresses() {
  return api.get('/users/addresses').then((response) => response.data);
}

export function createAddress(address) {
  return api.post('/addresses', address).then((response) => response.data);
}

export function updateAddress(addressId, address) {
  return api.put(`/addresses/${addressId}`, address).then((response) => response.data);
}

export function deleteAddress(addressId) {
  return api.delete(`/addresses/${addressId}`).then((response) => response.data);
}

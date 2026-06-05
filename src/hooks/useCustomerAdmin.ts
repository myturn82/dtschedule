import { useAuth } from './useAuth'

export function useCustomerAdmin() {
  const { myCustomer } = useAuth()
  return { myCustomer, isCustomerAdmin: myCustomer !== null }
}

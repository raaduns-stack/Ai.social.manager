import api from '../../lib/api-client'
import { Invoice } from '@socialpilot/shared-types'

export interface DbInvoice extends Invoice {
  invoiceNumber: string;
  issuedAt: string | Date;
}

export async function getInvoices(): Promise<DbInvoice[]> {
  const response = await api.get<DbInvoice[]>('/invoice')
  return response.data
}

export async function getInvoice(id: string): Promise<DbInvoice> {
  const response = await api.get<DbInvoice>(`/invoice/${id}`)
  return response.data
}

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

export async function downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
  const response = await api.get(`/invoice/${id}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

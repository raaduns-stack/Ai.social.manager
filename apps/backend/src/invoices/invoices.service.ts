import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class InvoicesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** Return all invoices for the logged-in user. */
  async findAllByUser(userId: string) {
    return this.db.query.invoices.findMany({
      where: eq(schema.invoices.userId, userId),
      with: {
        payment: true,
        subscription: true,
      },
    });
  }

  /** Return a single invoice detail by ID for the logged-in user. */
  async findOneByUser(id: string, userId: string) {
    const invoice = await this.db.query.invoices.findFirst({
      where: and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId)),
      with: {
        payment: true,
        subscription: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /** Generate an invoice PDF document buffer for downloading. */
  async generateInvoicePdf(id: string, userId: string): Promise<Buffer> {
    const invoice = await this.findOneByUser(id, userId);

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    let planName = 'Subscription Plan';
    if (invoice.subscription?.planId) {
      const plan = await this.db.query.plans.findFirst({
        where: eq(schema.plans.id, invoice.subscription.planId),
      });
      if (plan) {
        planName = plan.name;
      }
    }

    const amountFormatted = `${invoice.currency || 'NGN'} ${(invoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dateStr = new Date(invoice.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const customerName = user?.fullName || 'Valued Customer';
    const customerEmail = user?.email || 'N/A';
    const statusStr = (invoice.status || 'paid').toUpperCase();

    const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 1200 >>
stream
BT
/F1 24 Tf
50 730 Td
(AISOCIAL MANAGER) Tj
0 -26 Td
/F2 10 Tf
(Official Subscription Invoice) Tj
0 -40 Td
/F1 14 Tf
(INVOICE DETAILS) Tj
0 -20 Td
/F2 11 Tf
(Invoice Number: ${invoice.invoiceNumber}) Tj
0 -18 Td
(Issue Date: ${dateStr}) Tj
0 -18 Td
(Status: ${statusStr}) Tj
0 -35 Td
/F1 14 Tf
(CUSTOMER INFORMATION) Tj
0 -20 Td
/F2 11 Tf
(Customer Name: ${customerName}) Tj
0 -18 Td
(Email Address: ${customerEmail}) Tj
0 -35 Td
/F1 14 Tf
(BILLING SUMMARY) Tj
0 -20 Td
/F2 11 Tf
(Item Description: Subscription - ${planName}) Tj
0 -18 Td
(Total Amount Paid: ${amountFormatted}) Tj
0 -45 Td
/F1 11 Tf
(Thank you for choosing AISocial Manager!) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000335 00000 n 
0000000403 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1650
%%EOF`;

    return Buffer.from(pdfString);
  }
}

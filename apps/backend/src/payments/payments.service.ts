import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, ne } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { PlansService } from '../plans/plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly configService: ConfigService,
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Initialize a Flutterwave payment for a plan subscription.
   */
  async initializePayment(userId: string, planId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const plan = await this.plansService.findById(planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found or is no longer active');
    }

    // Create a pending subscription for this plan
    const subscription = await this.subscriptionsService.create(userId, planId);

    // Convert plan price from cents/kobo to main currency unit (Naira)
    const amountInNaira = (plan.price / 100).toString();

    // Generate unique transaction reference
    const txRef = `SPILOT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create pending payment record
    await this.db.insert(schema.payments).values({
      userId,
      subscriptionId: subscription.id,
      planId: plan.id,
      amount: plan.price,
      currency: 'NGN',
      status: 'pending',
      gateway: 'flutterwave',
      gatewayReference: txRef,
    });

    const secretKey =
      this.configService.get<string>('payments.flutterwaveSecretKey') ||
      process.env.FLUTTERWAVE_SECRET_KEY;

    const corsOrigin =
      this.configService.get<string>('corsOrigin') ?? 'http://localhost:5173';
    const redirectUrl = `${corsOrigin}/payments/callback`;

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amountInNaira,
        currency: 'NGN',
        redirect_url: redirectUrl,
        customer: {
          email: user.email,
          name: user.fullName,
        },
      }),
    });

    const data = await response.json();

    if (data.status !== 'success' || !data.data?.link) {
      throw new BadRequestException(
        data.message || 'Failed to initialize payment with Flutterwave',
      );
    }

    return { link: data.data.link };
  }

  /**
   * Verify a Flutterwave payment by transactionId or tx_ref.
   * Flutterwave appends ?transaction_id=<numeric_id>&tx_ref=... to the redirect URL.
   * The callback page should prefer passing transaction_id (numeric) for direct verification.
   * If a tx_ref string is passed instead, we look up our payment record to confirm it exists,
   * then call Flutterwave's verify API with the tx_ref (which Flutterwave also accepts).
   */
  async verifyPayment(userId: string, transactionId: string) {
    return this.verifyAndFulfillTransaction(transactionId);
  }


  /**
   * Handle incoming Flutterwave webhook notifications.
   */
  async handleWebhook(verifHashHeader: string | undefined, payload: any) {
    const secretHash =
      this.configService.get<string>('payments.webhookSecretHash') ||
      process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

    if (!verifHashHeader || verifHashHeader !== secretHash) {
      throw new UnauthorizedException('Invalid or missing verif-hash header');
    }

    if (
      payload?.event === 'charge.completed' &&
      payload?.data?.status === 'successful'
    ) {
      const transactionId = payload.data.id || payload.data.tx_ref;
      if (transactionId) {
        // Re-verify the transaction against Flutterwave API before activating anything
        return this.verifyAndFulfillTransaction(String(transactionId));
      }
    }

    return { status: 'ignored' };
  }

  /**
   * Re-verify transaction with Flutterwave API and fulfill if valid.
   */
  private async verifyAndFulfillTransaction(transactionId: string) {
    const secretKey =
      this.configService.get<string>('payments.flutterwaveSecretKey') ||
      process.env.FLUTTERWAVE_SECRET_KEY;

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    const flwRes = await response.json();

    if (flwRes.status !== 'success' || !flwRes.data) {
      throw new BadRequestException(
        flwRes.message || 'Failed to verify transaction with Flutterwave',
      );
    }

    const { tx_ref, status, amount, currency } = flwRes.data;

    const payment = await this.db.query.payments.findFirst({
      where: eq(schema.payments.gatewayReference, tx_ref),
    });

    if (!payment) {
      throw new NotFoundException(`Payment record not found for tx_ref: ${tx_ref}`);
    }

    const expectedAmount = payment.amount / 100;
    const isAmountValid = Number(amount) === expectedAmount;
    const isCurrencyValid = currency === payment.currency;
    const isSuccessful = status === 'successful' && isAmountValid && isCurrencyValid;

    if (!isSuccessful) {
      await this.db
        .update(schema.payments)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(schema.payments.id, payment.id));

      throw new BadRequestException(
        `Payment verification failed. Paid amount: ${amount} ${currency}, Expected: ${expectedAmount} ${payment.currency}`,
      );
    }

    return this.fulfillPayment(payment.id);
  }

  /**
   * Shared private method to mark payment successful, activate subscription,
   * expire old subscriptions, and auto-generate an invoice.
   */
  private async fulfillPayment(paymentId: string) {
    const payment = await this.db.query.payments.findFirst({
      where: eq(schema.payments.id, paymentId),
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status === 'successful') {
      return {
        status: 'successful',
        message: 'Payment has already been processed',
        paymentId: payment.id,
      };
    }

    // Mark payment as successful
    await this.db
      .update(schema.payments)
      .set({
        status: 'successful',
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, payment.id));

    // Activate the subscription if available
    if (payment.subscriptionId) {
      const plan = payment.planId
        ? await this.plansService.findById(payment.planId)
        : null;

      const startDate = new Date();
      const endDate = new Date(startDate);
      if (plan?.interval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Expire any previous active subscriptions for this user
      await this.db
        .update(schema.subscriptions)
        .set({
          status: 'expired',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.subscriptions.userId, payment.userId),
            eq(schema.subscriptions.status, 'active'),
            ne(schema.subscriptions.id, payment.subscriptionId),
          ),
        );

      // Activate pending subscription
      await this.db
        .update(schema.subscriptions)
        .set({
          status: 'active',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          updatedAt: new Date(),
        })
        .where(eq(schema.subscriptions.id, payment.subscriptionId));
    }

    // Automatically create an invoice record
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await this.db.insert(schema.invoices).values({
      userId: payment.userId,
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      invoiceNumber,
      amount: payment.amount,
      currency: payment.currency,
      status: 'paid',
      pdfUrl: null,
    });

    return {
      status: 'successful',
      message: 'Payment verified, subscription activated, and invoice generated successfully',
      paymentId: payment.id,
    };
  }
}

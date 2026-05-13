import midtransClient from "midtrans-client";
import crypto from "crypto";

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export interface CreateSnapParams {
  orderId: string;
  amount: number;
  userEmail: string;
  userName: string;
}

export const MidtransService = {
  /**
   * Create Snap transaction → return snapToken untuk dipake di Android SDK.
   */
  async createSnapTransaction(params: CreateSnapParams): Promise<{
    token: string;
    redirectUrl: string;
  }> {
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.userName,
        email: params.userEmail,
      },
      item_details: [
        {
          id: "SUB_MONTHLY",
          price: params.amount,
          quantity: 1,
          name: "Habisin Subscription (1 Bulan)",
        },
      ],
      credit_card: {
        secure: true,
      },
    };

    const response = await snap.createTransaction(parameter);
    return {
      token: response.token,
      redirectUrl: response.redirect_url,
    };
  },

  /**
   * Verify signature dari webhook Midtrans.
   * Formula: SHA512(order_id + status_code + gross_amount + server_key)
   * Wajib di-verify untuk mencegah orang fake webhook.
   */
  verifySignature(payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean {
    const expected = crypto
      .createHash("sha512")
      .update(
        payload.order_id +
        payload.status_code +
        payload.gross_amount +
        process.env.MIDTRANS_SERVER_KEY!
      )
      .digest("hex");
    return expected === payload.signature_key;
  },
};
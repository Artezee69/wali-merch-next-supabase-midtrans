declare module "midtrans-client" {
  export interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface SnapTransactionOptions {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    customer_details?: {
      first_name: string;
      email?: string;
      phone?: string;
      billing_address?: {
        first_name: string;
        email?: string;
        phone?: string;
        address: string;
        city: string;
        postal_code: string;
        country_code: string;
      };
      shipping_address?: {
        first_name: string;
        email?: string;
        phone?: string;
        address: string;
        city: string;
        postal_code: string;
        country_code: string;
      };
    };
  }

  export interface SnapTransactionResult {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(config: SnapConfig);
    createTransaction(options: SnapTransactionOptions): Promise<SnapTransactionResult>;
  }

  const midtransClient: {
    Snap: typeof Snap;
  };

  export default midtransClient;
}

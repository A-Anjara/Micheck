interface StripeLineItem {
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: {
      name: string;
      description: string;
    };
  };
  quantity: number;
}

interface CheckoutSessionParams {
  ui_mode?: string;
  line_items: StripeLineItem[];
  mode: string;
  payment_method_types?: string[];
  return_url?: string;
}

/**
 * Adaptateur Stripe minimal. Remplacer par le SDK Stripe et la clé secrète
 * lorsque le paiement sera configuré.
 */
export const stripe = {
  checkout: {
    sessions: {
      create: async (
        params: CheckoutSessionParams,
      ): Promise<{ id: string; client_secret: string | null }> => {
        void params;
        throw new Error("Stripe n'est pas configuré sur cet environnement.");
      },
    },
  },
};

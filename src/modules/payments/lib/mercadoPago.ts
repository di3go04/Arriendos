import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '',
});

export const createMPPreference = async (items: any[]) => {
    const preference = new Preference(client);
    const result = await preference.create({
        body: {
            items,
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
                failure: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
            },
            auto_return: "approved",
        },
    });
    return result;
};

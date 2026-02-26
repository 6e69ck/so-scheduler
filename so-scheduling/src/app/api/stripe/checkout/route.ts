import { NextResponse } from 'next/server';

// This is a placeholder for Stripe integration.
// To make this work, you need to install stripe: pnpm add stripe
// and add STRIPE_SECRET_KEY to your .env file.

export async function POST(req: Request) {
  try {
    const { amount, clientName, invoiceId } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe API key not configured' }, { status: 500 });
    }

    // import Stripe from 'stripe';
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency: 'usd',
    //       product_data: { name: `${clientName} - Invoice #${invoiceId}` },
    //       unit_amount: Math.round(amount * 100),
    //     },
    //     quantity: 1,
    //   }],
    //   mode: 'payment',
    //   success_url: `${req.headers.get('origin')}/invoice/success`,
    //   cancel_url: `${req.headers.get('origin')}/invoice/${invoiceId}`,
    // });

    // return NextResponse.json({ url: session.url });
    
    return NextResponse.json({ error: 'Stripe implementation template ready. Please install "stripe" package and uncomment logic in API route.' }, { status: 501 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

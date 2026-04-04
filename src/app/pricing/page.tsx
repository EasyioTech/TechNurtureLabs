import { redirect } from 'next/navigation';

export default function PricingPage() {
    // Redirect to the pricing section on the main landing page
    redirect('/#pricing');
}

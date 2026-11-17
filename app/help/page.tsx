import type { Metadata } from 'next';
import { ArrowRight, MapPin, Phone, Clock3 } from 'lucide-react';
import { PageShell } from '@/components/site-chrome';
import { readSiteContent } from '@/lib/site-content';

export const metadata: Metadata = { title: 'Delivery & Help | Munchy', description: 'Delivery areas, timings, cash payment, allergens, order changes and how to reach the Munchy kitchen in Casablanca.' };
export default async function HelpPage() {
  const { content: en } = await readSiteContent();
  const questions = [
  ['How do I place an order?', 'Pick your food, adjust quantities and head to checkout. Choose delivery or pickup, add your details, then send the prepared WhatsApp message. The kitchen confirms availability and timing before preparation.'],
  ['Where do you deliver?', `Our sample service area covers ${en.contact.deliveryZones.join(', ')}. Delivery costs ${en.contact.deliveryFee} DH, or is free on orders from ${en.contact.freeDeliveryFrom} DH. The kitchen confirms the address before accepting your order.`],
  ['How long will my food take?', 'Allow around 25–40 minutes for delivery and 15 minutes for pickup after kitchen confirmation. Traffic, weather and busy periods can change the estimate. Track the kitchen status with your order code.'],
  ['Can I pay in cash?', 'Yes. Pay in cash when your food arrives or when you collect it. Select exact change, 100 DH or 200 DH at checkout so the kitchen can prepare the change.'],
  ['Can I change or cancel an order?', 'Contact the kitchen with your order code as soon as possible. Changes and cancellations can usually be arranged before preparation starts. Once food is being cooked, the kitchen will explain what is possible.'],
  ['What about allergies?', 'Our kitchen handles wheat, dairy, eggs, sesame, soy and other allergens. Cross-contact is possible. Contact us before ordering if you have an allergy; a vegetarian filter does not mean an item is allergen-free.'],
  ['Something missing or wrong?', 'Contact the kitchen promptly with your order code and a description of the issue. Keep the packaging and a photo if relevant so the team can check and agree a replacement or other resolution.'],
  ['How is my information used?', 'Your name, phone, address and optional location pin are used to prepare, deliver and support your order. The cart and demo points stay in your browser. Opening WhatsApp shares the message with WhatsApp; you choose when to send it.'],
];

  return <PageShell><main className="help-page"><header className="page-hero"><p className="section-label">THE PRACTICAL STUFF</p><h1>Good food.<br /><em>Clear answers.</em></h1><p>From the first tap to the last fry. Here is how ordering from the Munchy kitchen works.</p></header><section className="help-layout"><aside className="help-contact"><p className="section-label">YOUR NEIGHBORHOOD KITCHEN</p><h2>Talk to us.</h2><p><MapPin size={18} />{en.contact.address}</p><a href={`tel:${en.contact.phone.replace(/\s/g, '')}`}><Phone size={18} />{en.contact.phone}</a><p><Clock3 size={18} />Mon–Thu 12:00–23:00<br />Fri–Sun 12:00–00:00</p><a className="button button-red" href={`mailto:${en.contact.email}`}>Email the kitchen<ArrowRight size={16} /></a><a href="/track">Track an existing order →</a></aside><div className="help-faq">{questions.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section><a className="button button-light" href="/menu">Back to the menu <ArrowRight size={16} /></a></main></PageShell>;
}

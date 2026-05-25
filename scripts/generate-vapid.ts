// Generates a fresh VAPID keypair for Web Push.
// Run once when setting up the app: `pnpm vapid`
// Then paste the two values into your .env.
import webpush from 'web-push';

const k = webpush.generateVAPIDKeys();
console.log('Generated VAPID keypair. Add these to your .env:\n');
console.log(`VAPID_PUBLIC_KEY=${k.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${k.privateKey}`);
console.log('\nAlso set VAPID_SUBJECT to a mailto: or https:// URL you control, e.g.');
console.log('VAPID_SUBJECT=mailto:you@example.com');

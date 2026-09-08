import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BPdvyCCscHuSNjHvU0RoxJP8V3csB2UHgfaWzI4uBeOMvN0LBYm-PUh2t4orbeqaE4Hj6s2JnCEBdgqXXWsZJ00';
const privateKey = process.env.VAPID_PRIVATE_KEY || '0mlmSh3hkL6NJM4Q3pVPsKVjVb_V09bC-6WNBA9LS0E';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@thesoaringeagles.ca';

webpush.setVapidDetails(subject, publicKey, privateKey);

export default webpush;
export { publicKey, privateKey, subject };

import QRCode from 'qrcode';

export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb9N2gfGZNClzwFazG3L';

let cachedQrDataUrl: string | null = null;

export async function getWhatsAppQrCodeDataUrl(url: string = WHATSAPP_CHANNEL_URL): Promise<string> {
  if (cachedQrDataUrl && url === WHATSAPP_CHANNEL_URL) {
    return cachedQrDataUrl;
  }
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    if (url === WHATSAPP_CHANNEL_URL) {
      cachedQrDataUrl = dataUrl;
    }
    return dataUrl;
  } catch (err) {
    console.error('Error generating WhatsApp QR Code:', err);
    return '';
  }
}

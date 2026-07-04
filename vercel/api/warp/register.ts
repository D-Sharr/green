import type { VercelRequest, VercelResponse } from '@vercel/node';
import nacl from 'tweetnacl';

const CF_WARP_API = 'https://api.cloudflareclient.com/v0a1922';
const CF_WARP_REGISTER = `${CF_WARP_API}/reg`;

function b64encode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function b64decode(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'base64'));
}

function genKeyPair(): { publicKey: string; secretKey: string } {
  const kp = nacl.box.keyPair();
  return {
    publicKey: b64encode(kp.publicKey),
    secretKey: b64encode(kp.secretKey),
  };
}

function getReservedFromToken(tokenB64: string): number[] {
  const bytes = b64decode(tokenB64);
  return [bytes[0], bytes[1], bytes[2]];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const expectedToken = process.env.VERCEL_WARP_TOKEN;

  if (!expectedToken) {
    return res.status(503).json({ error: 'VERCEL_WARP_TOKEN not configured' });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { endpoint: endpointOverride, remark = 'Local Anycast' } = req.body || {};

    const { publicKey, secretKey } = genKeyPair();
    const installId = crypto.randomUUID();

    const registerBody = {
      key: publicKey,
      install_id: installId,
      fcm_token: '',
      tos: new Date().toISOString(),
      type: 'Android',
      model: 'PC',
      locale: 'en_US',
    };

    const cfResponse = await fetch(CF_WARP_REGISTER, {
      method: 'POST',
      headers: {
        'CF-Client-Version': 'a-6.3-1922',
        'User-Agent': 'okhttp/3.12.1',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(registerBody),
    });

    if (!cfResponse.ok) {
      const errText = await cfResponse.text();
      return res.status(502).json({
        error: `Cloudflare WARP API error: ${cfResponse.status}`,
        details: errText,
      });
    }

    const cfData = await cfResponse.json() as any;

    const configId = cfData.id || '';
    const token = cfData.token || '';
    const clientId = cfData.config?.client_id || '';
    const peerPublicKey = cfData.config?.peers?.[0]?.public_key || 'bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=';
    const peerEndpointHost = cfData.config?.peers?.[0]?.endpoint?.host || '162.159.193.8';
    const peerEndpointV4 = cfData.config?.peers?.[0]?.endpoint?.v4 || `${peerEndpointHost}:2408`;
    const rawV4 = cfData.config?.interface?.addresses?.v4 || '172.16.0.2';
    const rawV6 = cfData.config?.interface?.addresses?.v6 || '';
    const addressV4 = rawV4.includes('/') ? rawV4 : `${rawV4}/32`;
    const addressV6 = rawV6.includes('/') ? rawV6 : (rawV6 ? `${rawV6}/128` : '');
    const mtu = 1280;

    const finalEndpoint = endpointOverride || peerEndpointV4;

    const reserved = getReservedFromToken(token);
    const reservedStr = reserved.join('%2C%20');

    const encPrivKey = encodeURIComponent(secretKey);
    const encPubKey = encodeURIComponent(peerPublicKey);
    const encAddressV4 = encodeURIComponent(addressV4);
    const encAddressV6 = encodeURIComponent(addressV6);
    const addressParam = addressV6
      ? `${encAddressV4}%2C%20${encAddressV6}`
      : encAddressV4;

    const warpUri = `wireguard://${encPrivKey}@${finalEndpoint}?publickey=${encPubKey}&presharedkey=&reserved=${reservedStr}&address=${addressParam}&mtu=${mtu}#${remark}`;

    return res.status(200).json({
      config_id: configId,
      private_key: secretKey,
      public_key: peerPublicKey,
      endpoint: finalEndpoint,
      address_v4: addressV4,
      address_v6: addressV6,
      reserved: reserved.join(', '),
      mtu,
      remark,
      uri: warpUri,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal error',
      details: err.message || String(err),
    });
  }
}

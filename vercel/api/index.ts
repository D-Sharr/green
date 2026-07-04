import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    service: 'Green WARP Generator',
    status: 'running',
    endpoints: {
      register: 'POST /api/warp/register',
    },
  });
}

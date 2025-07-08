// If you see type errors for 'formidable', install it and its types: npm i formidable && npm i --save-dev @types/formidable
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Fields, Files } from 'formidable';
import formidable, { File } from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err: any, fields: Fields, files: Files) => {
    if (err) return res.status(400).json({ error: 'Form parse error' });
    const { upload_url, start, end, totalSize } = fields;
    const file = files.file as File | File[] | undefined;
    if (!upload_url || !file || !start || !end || !totalSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const filePath = Array.isArray(file) ? file[0].filepath : file.filepath;
    const fileStream = fs.createReadStream(filePath);
    const response = await fetch(upload_url as string, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Type': 'video/mp4',
      },
      body: fileStream,
    });
    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  });
} 
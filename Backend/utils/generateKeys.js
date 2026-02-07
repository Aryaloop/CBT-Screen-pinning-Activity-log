// File: Backend/utils/generateKeys.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateKeys = () => {
  const keyPath = path.join(__dirname, '../keys');

  // Buat folder keys jika belum ada
  if (!fs.existsSync(keyPath)) {
    fs.mkdirSync(keyPath);
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // Standar keamanan saat ini
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  fs.writeFileSync(path.join(keyPath, 'public.pem'), publicKey);
  fs.writeFileSync(path.join(keyPath, 'private.pem'), privateKey);

  console.log('✅ Key Pair RSA Berhasil Dibuat di folder /keys');
};

generateKeys();
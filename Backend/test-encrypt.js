// Simpan ini sebagai test-encrypt.js
import crypto from 'crypto';
import fs from 'fs';

// Sesuaikan path ke public key Anda
const publicKey = fs.readFileSync('./Backend/keys/public.pem', 'utf8');

const password = "123456"; // Password yang mau ditest

const encrypted = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  },
  Buffer.from(password)
);

console.log("Copy ini ke Postman:");
console.log(encrypted.toString('base64'));
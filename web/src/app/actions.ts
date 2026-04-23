'use server';

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export async function compressFile(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file uploaded');
  }

  // Create temporary directory
  const tmpId = crypto.randomUUID();
  const baseTmpDir = '/tmp/huffpack'; // Adjust if not on unix
  const tmpDir = path.join(baseTmpDir, tmpId);
  await fs.mkdir(tmpDir, { recursive: true });

  const inputPath = path.join(tmpDir, file.name);
  const outputPath = path.join(tmpDir, file.name + '.huff');

  try {
    // Write the incoming file to tmp
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer));

    // Determine the huffpack binary path (adjust path to core/huffpack)
    const huffpackPath = path.resolve(process.cwd(), '../core/huffpack');

    // Run the native CLI tool
    await execFileAsync(huffpackPath, ['pack', outputPath, inputPath]);

    // Read the output
    const outputData = await fs.readFile(outputPath);
    
    // Return base64 to the client side. Not ideal for GB files, but works perfectly for a demo!
    return {
      success: true,
      filename: file.name + '.huff',
      size: outputData.length,
      originalSize: file.size,
      data: outputData.toString('base64'),
    };
  } catch (error: any) {
    console.error('Compression error:', error);
    return {
      success: false,
      error: error.message || 'Compression failed',
    };
  } finally {
    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
  }
}

export async function decompressFile(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file uploaded');
  }

  // Create temporary directory
  const tmpId = crypto.randomUUID();
  const baseTmpDir = '/tmp/huffpack';
  const tmpDir = path.join(baseTmpDir, tmpId);
  const outputDir = path.join(tmpDir, 'output');
  await fs.mkdir(outputDir, { recursive: true });

  const inputPath = path.join(tmpDir, file.name);

  try {
    // Write the incoming file to tmp
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer));

    // Determine the huffpack binary path
    const huffpackPath = path.resolve(process.cwd(), '../core/huffpack');

    // Run the native CLI tool to extract
    await execFileAsync(huffpackPath, ['unpack', inputPath, outputDir]);

    // Check output directory for extracted file(s)
    const files = await fs.readdir(outputDir);
    if (files.length === 0) {
       throw new Error('Nothing was extracted');
    }
    
    // For this simple single-file UI, we grab the first extracted file
    const extractedFile = files[0];
    const extractedFilePath = path.join(outputDir, extractedFile);
    
    const outputData = await fs.readFile(extractedFilePath);
    
    return {
      success: true,
      filename: extractedFile,
      size: outputData.length,
      originalSize: file.size,
      data: outputData.toString('base64'),
    };
  } catch (error: any) {
    console.error('Decompression error:', error);
    return {
      success: false,
      error: error.message || 'Decompression failed',
    };
  } finally {
    // Clean up
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
  }
}

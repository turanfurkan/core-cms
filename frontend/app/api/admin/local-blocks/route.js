import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const blocksDir = path.join(process.cwd(), 'components', 'blocks');
    const files = await fs.promises.readdir(blocksDir);
    
    const excludeFiles = ['block-renderer.jsx', 'post-block-renderer.jsx', 'schemas.js'];
    const blockFiles = files
      .filter(file => file.endsWith('.jsx') && !excludeFiles.includes(file))
      .map(file => {
        const baseName = file.replace('.jsx', '');
        let type = baseName.replace(/-/g, '_');
        if (baseName === 'slider-carousel') {
          type = 'slider';
        }
        
        const label = baseName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        return {
          filename: file,
          type,
          label
        };
      });

    return NextResponse.json({ data: blockFiles });
  } catch (error) {
    console.error('Error scanning local blocks:', error);
    return NextResponse.json({ message: error.message || 'Something went wrong.' }, { status: 500 });
  }
}

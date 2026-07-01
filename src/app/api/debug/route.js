import { NextResponse } from 'next/server';

export async function POST(request) {
  const data = await request.json();
  console.log('\n\n\n=== COMPUTED STYLES MEASUREMENT ===');
  console.log(JSON.stringify(data, null, 2));
  console.log('===================================\n\n\n');
  return NextResponse.json({ success: true });
}

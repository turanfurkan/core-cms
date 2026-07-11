import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  redirect(`/yarislar/${slug}`);

}


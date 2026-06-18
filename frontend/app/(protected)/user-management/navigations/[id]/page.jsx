'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MoveLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { ContentLoader } from '@/components/common/content-loader';
import MenuBuilder from './components/menu-builder';

export default function Page({ params }) {
  const { id } = use(params);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-navigation', id],
    queryFn: async () => {
      const response = await apiFetch(`/api/user-management/navigations/${id}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch navigation detail.');
      }
      return response.json();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  if (isLoading) {
    return <ContentLoader className="mt-[30%]" />;
  }

  if (isError) {
    return (
      <Container className="py-10">
        <div className="text-red-500 font-semibold text-center">
          Error: {error.message || 'Could not load navigation menu.'}
        </div>
      </Container>
    );
  }

  const navigation = data?.data || data;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Menu Builder: {navigation?.name}</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/user-management/navigations">Navigations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Menu Builder</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Button asChild variant="outline">
              <Link href="/user-management/navigations">
                <MoveLeft className="size-4 mr-2" /> Back to menus
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <MenuBuilder navigation={navigation} />
      </Container>
    </>
  );
}

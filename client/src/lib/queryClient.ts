import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error = new Error(`${res.status}: ${text}`);
    
    // Redirection automatique pour les erreurs 401
    if (res.status === 401) {
      console.log('🔒 Session expirée, redirection vers authentification');
      window.location.href = '/auth';
    }
    
    throw error;
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<any> {
  console.log("🌐 API Request:", { url, method, body });
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  console.log("🌐 API Response:", { status: res.status, ok: res.ok });
  
  await throwIfResNotOk(res);
  
  // Return JSON response
  if (res.headers.get('content-type')?.includes('application/json')) {
    return await res.json();
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      staleTime: 30 * 1000, // 30 secondes de cache pour de meilleures performances
      gcTime: 10 * 60 * 1000, // 10 minutes  
      retry: (failureCount, error: any) => {
        // Ne pas retry les erreurs d'authentification
        if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          console.log('🔒 Erreur 401 détectée, redirection vers authentification');
          window.location.href = '/auth';
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

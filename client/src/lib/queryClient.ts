import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Construct the URL from the queryKey array
    let url = queryKey[0] as string;
    
    // If it's a nested query like ["/api/books", bookId, "questions"], construct proper URL
    if (queryKey.length > 1) {
      // Handle multi-part query keys like ["/api/books", bookId, "reviews"]
      const parts = (queryKey[0] as string).split('/');
      const baseEndpoint = parts.slice(0, 3).join('/'); // Get the base endpoint (e.g., "/api/books")
      
      // If the second key is a number (ID) and there's a third part
      if (typeof queryKey[1] === 'number' && queryKey[2]) {
        url = `${baseEndpoint}/${queryKey[1]}/${queryKey[2]}`;
      } 
      // If just the second key is present (and it's a number)
      else if (typeof queryKey[1] === 'number') {
        url = `${baseEndpoint}/${queryKey[1]}`;
      }
    }
    
    const res = await fetch(url, {
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  const headerStore = headers();
  const isSecure = (headerStore.get("x-forwarded-proto") ?? "http") === "https";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // We intentionally avoid overriding set/remove here to let the default Supabase cookie
      // behavior run without custom names or storage keys.
    },
    cookieOptions: {
      secure: isSecure,
    },
  });
};

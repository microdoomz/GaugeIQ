import { createSupabaseServerClient } from "./supabaseServer";

export const getUserSession = async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const requireUser = async () => {
  const session = await getUserSession();
  if (!session) {
    return null;
  }
  return session.user;
};

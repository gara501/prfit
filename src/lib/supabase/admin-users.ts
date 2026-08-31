import type { User } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { AppRole } from "@/lib/auth/roles";
import { isAppRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole = AppRole;

export type AdminUserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | null;
  createdAt: string;
  lastSignInAt: string | null;
  isActive: boolean;
};

type UserListResult =
  | { users: AdminUserListItem[]; error: null; currentUserId: string }
  | { users: []; error: string; currentUserId: string };

async function listAllAuthUsers(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
) {
  const users: User[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      return { users: [], error };
    }

    users.push(...data.users);

    if (data.users.length < perPage) {
      return { users, error: null };
    }

    page += 1;
  }
}

export async function listAdminUsers(): Promise<UserListResult> {
  const currentUser = await requireAdmin();

  const supabaseAdmin = createAdminClient();
  const [authResult, profilesResult] = await Promise.all([
    listAllAuthUsers(supabaseAdmin),
    supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, role, is_active"),
  ]);

  if (authResult.error) {
    return {
      users: [],
      error: authResult.error.message,
      currentUserId: currentUser.id,
    };
  }

  if (profilesResult.error) {
    return {
      users: [],
      error: profilesResult.error.message,
      currentUserId: currentUser.id,
    };
  }

  const profilesById = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );

  const users = authResult.users
    .map((user) => {
      const profile = profilesById.get(user.id);
      const metadataRole = user.user_metadata.role;

      return {
        id: user.id,
        email: user.email ?? "Sin correo",
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        role: isAppRole(profile?.role)
          ? profile.role
          : isAppRole(metadataRole)
            ? metadataRole
            : null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        isActive: profile?.is_active === true,
      } satisfies AdminUserListItem;
    })
    .sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );

  return { users, error: null, currentUserId: currentUser.id };
}

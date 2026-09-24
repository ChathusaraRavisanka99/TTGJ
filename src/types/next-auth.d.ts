import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN" | "STAFF";
      // Only ever non-null for a STAFF user — which storefront(s) they're
      // scoped to. See User.staffMarketScope's own schema comment.
      staffMarketScope: "intl" | "lk" | "both" | null;
      // Only meaningful for STAFF — see lib/staff-permissions.ts.
      staffPermissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: "CUSTOMER" | "ADMIN" | "STAFF";
    staffMarketScope?: "intl" | "lk" | "both" | null;
    staffPermissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CUSTOMER" | "ADMIN" | "STAFF";
    staffMarketScope?: "intl" | "lk" | "both" | null;
    staffPermissions?: string[];
  }
}

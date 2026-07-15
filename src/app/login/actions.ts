"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = {
  error: "invalid" | "unexpected" | null;
};

export async function authenticate(
  callbackUrl: string,
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
    return { error: null };
  } catch (error) {
    // next-auth's redirect on success is implemented by throwing a special
    // Next.js redirect error — it must propagate, not be treated as a failure.
    if (error instanceof AuthError) {
      return { error: "invalid" };
    }
    throw error;
  }
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ email, hashedPassword: passwordHash });

    return NextResponse.json({ok:true}, {status: 201});
}
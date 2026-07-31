import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
});

// GET /api/chat?with=<userId> -> conversation history with that user
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");
  if (!withUserId) {
    return NextResponse.json({ error: "with পরামিতি প্রয়োজন" }, { status: 400 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: withUserId },
        { senderId: withUserId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId: session.user.id,
      receiverId: parsed.data.receiverId,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  id: string;
  username: string;
  name: string;
  role: "SUPERADMIN" | "ADMIN" | "RECEPTIONIST" | "TECHNICIAN";
}

export interface DentistSessionData {
  dentistId: string;
}

export const sessionOptions = {
  cookieName: "radiologia-auth",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // 12 horas de turno
    path: "/",
  },
};

export const dentistSessionOptions = {
  cookieName: "dentist_session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.id) return null;
  return session;
}

export async function getDentistSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<DentistSessionData>(cookieStore, dentistSessionOptions);
  if (!session.dentistId) return null;
  return session;
}

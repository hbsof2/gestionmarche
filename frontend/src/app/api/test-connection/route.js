import { testConnection } from "@/lib/supabase";

export async function GET() {
  try {
    const timestamp = await testConnection();
    return Response.json({
      success: true,
      message: "Supabase connection successful",
      timestamp,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Supabase connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

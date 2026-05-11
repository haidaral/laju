import { apiNotConfigured } from "../../lib/laju-api-contracts";

export async function GET() {
  return apiNotConfigured("Server-side export API");
}

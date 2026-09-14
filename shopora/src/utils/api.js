// Small shared helper used by auth calls (and anything else that talks to
// the API) so we never crash on a non-JSON response body.
//
// The backend usually returns JSON, but ASP.NET's default BadRequest(string)
// / Unauthorized(string) results, or an unexpected server/proxy error page,
// can come back as plain text. Blindly calling response.json() on those
// throws "Unexpected token ... is not valid JSON" and breaks the UI.
//
// This reads the body once as text, then tries to JSON.parse it. If that
// fails, the raw text is returned instead so callers can still show a
// meaningful message.
export async function parseResponse(response) {
  const raw = await response.text();

  if (!raw) {
    return "";
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

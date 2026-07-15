// SameSite=Lax already stops the session cookie from riding along on
// cross-site POSTs, but for the two most dangerous endpoints (DB backup
// download, DB restore) we add a second, independent check: the
// Fetch Metadata `Sec-Fetch-Site` header is set by the browser itself and
// cannot be spoofed by page content, so it's a reliable signal that a
// request did not originate from this app's own pages.
export class CrossOriginRequestError extends Error {
  constructor() {
    super("Cross-origin request rejected");
    this.name = "CrossOriginRequestError";
  }
}

export function requireSameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  // Absent header = older browser or non-fetch client; allow (can't verify,
  // don't want to break legitimate direct-link downloads on older clients).
  if (site && site !== "same-origin" && site !== "none") {
    throw new CrossOriginRequestError();
  }
}

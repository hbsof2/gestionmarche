// Supabase wraps passwords with special chars in [...] in the connection string,
// which also makes the URL unparseable by the native URL() constructor — parse manually.
function parseConnectionString(url) {
  const match = url.match(
    /^(?:postgresql|postgres):\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/
  );
  if (!match) throw new Error("Invalid DATABASE_URL format");
  const [, user, password, host, port, database] = match;
  const cleanPassword =
    password.startsWith("[") && password.endsWith("]")
      ? password.slice(1, -1)
      : password;
  return { user, password: cleanPassword, host, port: parseInt(port), database };
}

module.exports = parseConnectionString;

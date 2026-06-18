export async function systemLog(
  { event, userId, entityId, entityType, description, ipAddress, meta },
  tx = null,
) {
  // Frontend DB is deprecated; activity logs are natively tracked on the Laravel backend.
  console.log(
    `[SYSTEM LOG] ${event?.toUpperCase()} by User ID ${userId}: ${description} [${entityType}] (IP: ${ipAddress})`,
  );
}

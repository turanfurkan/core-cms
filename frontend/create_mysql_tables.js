const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS UserRole (
        id VARCHAR(191) PRIMARY KEY,
        slug VARCHAR(191) UNIQUE NOT NULL,
        name VARCHAR(191) UNIQUE NOT NULL,
        description TEXT,
        isTrashed BOOLEAN NOT NULL DEFAULT false,
        createdByUserId VARCHAR(191),
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        isProtected BOOLEAN NOT NULL DEFAULT false,
        isDefault BOOLEAN NOT NULL DEFAULT false
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) PRIMARY KEY,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(191),
        country VARCHAR(191),
        timezone VARCHAR(191),
        name VARCHAR(191),
        roleId VARCHAR(191) NOT NULL,
        status VARCHAR(191) NOT NULL DEFAULT 'INACTIVE',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
        lastSignInAt DATETIME(3),
        emailVerifiedAt DATETIME(3),
        isTrashed BOOLEAN NOT NULL DEFAULT false,
        avatar VARCHAR(191),
        invitedByUserId VARCHAR(191),
        isProtected BOOLEAN NOT NULL DEFAULT false,
        FOREIGN KEY (roleId) REFERENCES UserRole(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS UserPermission (
        id VARCHAR(191) PRIMARY KEY,
        slug VARCHAR(191) UNIQUE NOT NULL,
        name VARCHAR(191) NOT NULL,
        description TEXT,
        createdByUserId VARCHAR(191),
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS UserRolePermission (
        id VARCHAR(191) PRIMARY KEY,
        roleId VARCHAR(191) NOT NULL,
        permissionId VARCHAR(191) NOT NULL,
        assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        UNIQUE KEY (roleId, permissionId),
        FOREIGN KEY (roleId) REFERENCES UserRole(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (permissionId) REFERENCES UserPermission(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS Account (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) NOT NULL,
        type VARCHAR(191) NOT NULL,
        provider VARCHAR(191) NOT NULL,
        providerAccountId VARCHAR(191) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INT,
        token_type VARCHAR(191),
        scope VARCHAR(191),
        id_token TEXT,
        session_state VARCHAR(191),
        UNIQUE KEY (provider, providerAccountId),
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS Session (
        id VARCHAR(191) PRIMARY KEY,
        sessionToken VARCHAR(191) UNIQUE NOT NULL,
        userId VARCHAR(191) NOT NULL,
        expires DATETIME(3) NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS VerificationToken (
        identifier VARCHAR(191) NOT NULL,
        token VARCHAR(191) UNIQUE NOT NULL,
        expires DATETIME(3) NOT NULL,
        UNIQUE KEY (identifier, token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS SystemLog (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        entityId VARCHAR(191),
        entityType VARCHAR(191),
        event VARCHAR(191),
        description TEXT,
        ipAddress VARCHAR(191),
        meta TEXT,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS SystemSetting (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL DEFAULT 'My Company',
        logo VARCHAR(191),
        active BOOLEAN NOT NULL DEFAULT true,
        address TEXT,
        websiteURL VARCHAR(191),
        supportEmail VARCHAR(191),
        supportPhone VARCHAR(191),
        language VARCHAR(191) NOT NULL DEFAULT 'en',
        timezone VARCHAR(191) NOT NULL DEFAULT 'UTC',
        currency VARCHAR(191) NOT NULL DEFAULT 'USD',
        currencyFormat VARCHAR(191) NOT NULL DEFAULT '$ {value}',
        socialFacebook VARCHAR(191),
        socialTwitter VARCHAR(191),
        socialInstagram VARCHAR(191),
        socialLinkedIn VARCHAR(191),
        socialPinterest VARCHAR(191),
        socialYoutube VARCHAR(191),
        notifyStockEmail BOOLEAN NOT NULL DEFAULT true,
        notifyStockWeb BOOLEAN NOT NULL DEFAULT true,
        notifyStockThreshold INT NOT NULL DEFAULT 10,
        notifyStockRoleIds JSON,
        notifyNewOrderEmail BOOLEAN NOT NULL DEFAULT true,
        notifyNewOrderWeb BOOLEAN NOT NULL DEFAULT true,
        notifyNewOrderRoleIds JSON,
        notifyOrderStatusUpdateEmail BOOLEAN NOT NULL DEFAULT true,
        notifyOrderStatusUpdateWeb BOOLEAN NOT NULL DEFAULT true,
        notifyOrderStatusUpdateRoleIds JSON,
        notifyPaymentFailureEmail BOOLEAN NOT NULL DEFAULT true,
        notifyPaymentFailureWeb BOOLEAN NOT NULL DEFAULT true,
        notifyPaymentFailureRoleIds JSON,
        notifySystemErrorFailureEmail BOOLEAN NOT NULL DEFAULT true,
        notifySystemErrorWeb BOOLEAN NOT NULL DEFAULT true,
        notifySystemErrorRoleIds JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  console.log("Creating Next.js tables in MySQL database...");
  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
    } catch (e) {
      console.error("Error executing query:", e);
      throw e;
    }
  }
  console.log("All Next.js tables created successfully in MySQL database core_cms_db!");
}

main()
  .catch((e) => {
    console.error("Initialization failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

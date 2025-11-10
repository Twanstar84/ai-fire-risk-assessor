  numberOfOccupants: int("numberOfOccupants"),
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"]).default("draft").notNull(),
  summary: text("summary"), // Overall assessment summary
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const findings = mysqlTable("findings", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => assessments.id),
  category: varchar("category", { length: 100 }).notNull(), // exits, alarms, sprinklers, electrical, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: mysqlEnum("severity", ["observation", "minor", "major", "critical"]).notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "deferred"]).default("open").notNull(),
  recommendedAction: text("recommendedAction"),
  standardsReference: varchar("standardsReference", { length: 255 }), // e.g., "NFPA 101 Section 7.2"
  imageUrl: varchar("imageUrl", { length: 512 }), // S3 URL to finding image
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversationHistory = mysqlTable("conversationHistory", {
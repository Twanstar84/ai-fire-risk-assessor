  return await db
    .select()
    .from(findings)
    .where(eq(findings.assessmentId, assessmentId))
    .orderBy(desc(findings.severity));
}

// Conversation history queries
export async function addConversationMessage(data: InsertConversationHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(conversationHistory).values(data);
}

export async function getConversationHistory(assessmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(conversationHistory)
    .where(eq(conversationHistory.assessmentId, assessmentId))
    .orderBy(conversationHistory.createdAt);
}

// Assessment images queries
export async function addAssessmentImage(data: InsertAssessmentImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(assessmentImages).values(data);
}

export async function getAssessmentImages(assessmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
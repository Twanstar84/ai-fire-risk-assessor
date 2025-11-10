import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import {
  createAssessment,
  getAssessmentById,
  getUserAssessments,
  updateAssessment,
  addConversationMessage,
  getConversationHistory,
  createFinding,
  getAssessmentFindings,
  addAssessmentImage,
  getAssessmentImages,
  getFireStandards,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { generateReportHTML } from "./pdf-generator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assessment: router({
    create: protectedProcedure
      .input(
        z.object({
          buildingName: z.string(),
          buildingType: z.string().optional(),
          address: z.string().optional(),
          occupancyType: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createAssessment(ctx.user.id, {
          buildingName: input.buildingName,
          buildingType: input.buildingType || null,
          address: input.address || null,
          occupancyType: input.occupancyType || null,
          status: "draft",
          assessmentDate: new Date(),
        });
        return result;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserAssessments(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentById(input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await updateAssessment(input.id, input.data || {});
      }),
  }),

  conversation: router({
    chat: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          message: z.string(),
          audioTranscript: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addConversationMessage({
          assessmentId: input.assessmentId,
          role: "user",
          content: input.message,
          audioTranscript: input.audioTranscript,
        });

        const history = await getConversationHistory(input.assessmentId);
        const assessment = await getAssessmentById(input.assessmentId);
        const standards = await getFireStandards();

        const standardsText = standards
          .map(
            (s) =>
              `${s.standardCode}: ${s.title}. Category: ${s.category}. Requirements: ${s.keyRequirements}`
          )
          .join("\n");

        const systemPrompt = `You are an expert fire risk assessment assistant helping conduct a UK Regulatory Reform Fire Safety Order 2005 assessment.

Building: ${assessment?.buildingName}
Type: ${assessment?.buildingType}
Address: ${assessment?.address}

Relevant Fire Safety Standards:
${standardsText}

Your role is to:
1. Ask targeted questions about fire hazards and protection measures
2. Provide expert guidance on fire safety requirements
3. Identify risks and suggest remedial actions
4. Reference relevant standards and regulations
5. Help fill out the assessment form systematically

Conduct the assessment in a conversational manner, asking one or two questions at a time. When you identify a finding, clearly state it with severity level (observation, minor, major, critical) and recommended actions.`;

        const messages = history.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        }));

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        });

        const assistantContent = response.choices[0]?.message?.content;
        const assistantMessage =
          typeof assistantContent === "string"
            ? assistantContent
            : "Unable to generate response";

        await addConversationMessage({
          assessmentId: input.assessmentId,
          role: "assistant",
          content: assistantMessage,
        });

        // Extract findings from the AI response
        const findingsExtractionPrompt = `Extract any fire safety findings from the following assessment response. Return a JSON array of findings. Each finding should have:
- category: string (e.g., "Escape Routes", "Fire Doors", "Housekeeping")
- title: string (brief title)
- description: string (detailed description)
- severity: "observation" | "minor" | "major" | "critical"
- recommendedAction: string (what should be done)
- standardsReference: string (relevant standard like "RRFSO 2005" or "BS 9999")

If no findings are present, return an empty array [].

Assessment Response:
${assistantMessage}`;

        try {
          const findingsResponse = await invokeLLM({
            messages: [
              { role: "system", content: "You are a fire safety expert that extracts structured findings from assessment conversations. Always return valid JSON." },
              { role: "user", content: findingsExtractionPrompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "findings_extraction",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    findings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string" },
                          title: { type: "string" },
                          description: { type: "string" },
                          severity: { type: "string", enum: ["observation", "minor", "major", "critical"] },
                          recommendedAction: { type: "string" },
                          standardsReference: { type: "string" },
                        },
                        required: ["category", "title", "description", "severity", "recommendedAction", "standardsReference"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["findings"],
                  additionalProperties: false,
                },
              },
            },
          });

          const findingsContent = findingsResponse.choices[0]?.message?.content;
          if (findingsContent && typeof findingsContent === "string") {
            const parsedFindings = JSON.parse(findingsContent);
            if (parsedFindings.findings && Array.isArray(parsedFindings.findings)) {
              for (const finding of parsedFindings.findings) {
                await createFinding({
                  assessmentId: input.assessmentId,
                  category: finding.category,
                  title: finding.title,
                  description: finding.description,
                  severity: finding.severity as "observation" | "minor" | "major" | "critical",
                  recommendedAction: finding.recommendedAction,
                  standardsReference: finding.standardsReference,
                  status: "open",
                });
              }
            }
          }
        } catch (error) {
          console.error("Error extracting findings:", error);
          // Continue even if findings extraction fails
        }

        return {
          message: assistantMessage,
          conversationId: input.assessmentId,
        };
      }),

    history: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getConversationHistory(input.assessmentId);
      }),
  }),

  findings: router({
    list: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentFindings(input.assessmentId);
      }),
  }),

  images: router({
    list: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentImages(input.assessmentId);
      }),
  }),

  report: router({
    generatePDF: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        const findings = await getAssessmentFindings(input.assessmentId);
        const conversation = await getConversationHistory(input.assessmentId);

        if (!assessment) {
          throw new Error("Assessment not found");
        }

        const reportData = {
          assessment,
          findings,
          conversation,
          generatedAt: new Date().toISOString(),
        };

        const htmlContent = generateReportHTML(reportData);
        const fileName = `Fire_Risk_Assessment_${assessment.buildingName}_${new Date().toISOString().split("T")[0]}.html`;

        return {
          success: true,
          htmlContent,
          fileName,
          message: "Report generated successfully",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

import { z } from "zod";

const B_Reqdto = z
  .object({
    b_profile: z.array(
      z.object({
        nic: z
          .string()
          .min(1, "NIC is required")
          .regex(/^([0-9]{9}[vVxX]|[0-9]{12})$/, "Invalid format for NIC"),
        name: z.string().min(1, "Name is required"),
        phone_no: z
          .string()
          .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
        age: z
          .number()
          .min(0, "Age must be a positive number")
          .max(100, "Age must be less than 100"),
        gender: z.enum(
          ["male", "female"],
          "Gender must be either 'male' or 'female'",
        ),
        address: z.string().min(1, "Address is required"),
        gn_division: z.string().min(1, "GN Division is required"),
        family_size: z.number().min(1, "Family size must be at least 1"),
        children_under_18: z.number().min(0, "Cannot be negative").default(0),
        monthly_income: z
          .number()
          .min(0, "Monthly income cannot be a negative"),
        employment_type: z.enum(
          [
            "Government",
            "Private",
            "Self employed",
            "Unemployed",
            "Daily wage",
          ],
          "Invalid employment type",
        ),
        GovtAllowance: z
        .array(
          z.enum(
            ["Samurdhi", "Elderly Allowance", "Disability Allowance", "Ath Wasuma", "Other"],
            "Invalid government allowance"
          )
        )
        .optional()
        .default([]),
       otherIncomeSources: z.string().optional().default(""),
        chronic_illness: z.object({
          exists: z.boolean().default(false),
          description: z.string().optional(),
        }),
        nearest_hospitalkm: z
          .number()
          .min(0, "Distance to nearest hospital cannot be negative")
          .default(0),
        disabilityInHousehold: z.boolean().default(false),
        highestEducationLevel: z.enum(
          ["none", "1-10", "O/Level", "A/Level", "degree", "other"],
          "Invalid education level",
        ),
        distanceToSchoolKm: z
          .number()
          .min(0, "Distance to school cannot be negative")
          .default(0),
        childrenDroppedOut: z.boolean().default(false),
        housing_type: z
          .enum(
            ["own", "rent", "temporary", "no-fixed_shelter"],
            "Invalid housing type",
          )
          .default("temporary"),
        safewater_access: z.boolean().default(false),
        sanitation_access: z.boolean().default(false),
        electricity_access: z.boolean().default(false),
        support_types: z
          .array(
            z.enum(
              [
                "financial",
                "medical",
                "educational",
                "sanitation",
                "pre-loved_items",
                "counselling",
                "other",
              ],
              "Invalid support type",
            ),
          )
          .min(1, "At least one support type is required"),
        support_description: z
          .string()
          .min(10, "Please provide your situation in at least 10 characters"),
        selfrated_urgency: z
          .enum(
            ["1", "2", "3", "4", "5"],
            "Urgency rating must be between 1 and 5",
          )
          .default("5"),
      }),
    ),
    req_evidence: z
      .array(
        z
          .object({
            fileUrl: z.string().min(1, "File URL is required"),
            file_name: z.string().min(1, "File name is required").optional(),
            description: z.string().max(200, "Description too long").optional(),
            uploaded_at: z.string().optional(),
          })
          .passthrough(),
      )
      .default([]),

    gn_division_Id: z.string().min(1, "GN Division ID is required").optional(),

    Predictions: z
      .array(
        z.object({
          month: z
            .number()
            .min(1, "Month should be in between 1 and 12")
            .optional(),
          score: z.number().min(0, "Score cannot be negative").optional(),
        }),
      )
      .optional(),

    status: z
      .enum(
        [
          "pending",
          "gn_assigned",
          "verified",
          "flagged",
          "resolved",
          "rejected",
        ],
        "Invalid status",
      )
      .default("pending")
      .optional(),
    gn_verified: z.boolean().default(false),
    reference_no: z
      .string()
      .min(0, "reference number is required")
      .nullish()
      .optional(),
    urgency_score: z
      .number()
      .min(0, "urgency score cannot be negative")
      .default(0)
      .optional(),
    urgency_label: z
      .enum(["low", "medium", "high"], "Invalid label")
      .optional(),
    cluster_no: z
      .number()
      .min(1, "Cluster number should be in between 1 & 3")
      .optional(),
    pca_x: z
      .number()
      .min(0, "PCA X should be greater than or equal to 0")
      .nullish()
      .optional(),
    pca_y: z
      .number()
      .min(0, "PCA Y should be greater than or equal to 0")
      .nullish()
      .optional(),
  })
  .passthrough();

export default B_Reqdto;

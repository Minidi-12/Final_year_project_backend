import {z} from 'zod';

const Gn_Verificationdto = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  gnOfficerId: z.string().min(1, "GN Officer ID is required"),
  status: z.enum(["pending", "verified", "flagged"],"Invalid verification status"),
  gn_division: z.string().min(1, "GN Division is required"),
  notes: z.string().max(500, "Notes are too long").optional(),
})
.refine((data) => {
  // notes are mandatory when status is partial or flagged
  if (
    (data.status === "pending" || data.status === "flagged") &&
    (!data.notes || data.notes.trim().length === 0)
  ) {
    return false;
  }
  return true;
}, {
  message: "Notes are required when status is partial or flagged",
  path: ["notes"],
});


export default Gn_Verificationdto;
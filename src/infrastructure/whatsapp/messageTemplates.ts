export const templates = {

  requestSubmitted: (name: string, reference_no: string) =>
    `*Request Received!*\n\n` +
    `Dear ${name},\n\n` +
    `Your aid request has been successfully submitted to our system.\n\n` +
    `*Reference ID:* ${reference_no}\n\n` +
    `Please keep this ID safe. You will receive updates here on WhatsApp as your request progresses.\n\n` +
    `-HOPELINK-`,

  statusChanged: (name: string, reference_no: string, newStatus: string) => {
    const statusMessages: Record<string, string> = {
      pending:     " Your request is *pending* and will be assigned soon.",
      gn_assigned: " Your request has been *assigned to a GN Officer* for field verification.",
      verified:    " Your request has been *verified* and is under review by the NGO.",
      flagged:     " Your request has been *flagged* for additional review. An officer will contact you.",
      resolved:    " Your request has been *resolved*! Support has been arranged for you.",
      rejected:    " Unfortunately, your request has been *rejected*. Please contact your GN Officer for details.",
    };
    return (
      `*Request Status Update*\n\n` +
      `Dear ${name},\n\n` +
      `${statusMessages[newStatus] || `Status updated to: *${newStatus}*`}\n\n` +
      ` *Reference ID:* ${reference_no}\n\n` +
      `-HOPELINK-`
    );
  },

  gnAssigned: (name: string, reference_no: string, gn_division_Name: string) =>
    ` *GN Officer Assigned*\n\n` +
    `Dear ${name},\n\n` +
    `A Grama Niladhari Officer from *${gn_division_Name}* has been assigned to verify your request.\n\n` +
    `They may visit your home or contact you for verification.\n\n` +
    ` *Reference ID:* ${reference_no}\n\n` +
    `-HOPELINK-`,

  requestVerified: (name: string, reference_no: string) =>
    `*Request Verified!*\n\n` +
    `Dear ${name},\n\n` +
    `Your request has been *successfully verified* by the GN Officer.\n\n` +
    `Your case is now being reviewed by the NGO administration for support allocation.\n\n` +
    `*Reference ID:* ${reference_no}\n\n` +
    `-HOPELINK-`,

  requestResolved: (name: string, reference_no: string) =>
    ` *Great News!*\n\n` +
    `Dear ${name},\n\n` +
    `Your support request has been *resolved*. The necessary assistance has been arranged for your family.\n\n` +
    `We hope this support makes a difference. Thank you for trusting us.\n\n` +
    `*Reference ID:* ${reference_no}\n\n` +
    `-HOPELINK-`,

  gnOfficerAssigned: (
    officerName: string,
    totalAssigned: number,
    gn_division_Name: string,
    month: string
  ) =>
    ` *Monthly Assignment Notice*\n\n` +
    `Dear ${officerName},\n\n` +
    `You have been assigned *${totalAssigned} new request(s)* from *${gn_division_Name}* for verification this month (${month}).\n\n` +
    `Please log in to the portal to review and verify these cases.\n\n` +
    ` Portal:http://localhost:5173/login\n\n` +
    `-HOPELINK-`,
};
export const templates = {

  requestSubmitted: (name: string, refId: string) =>
    ` *Request Received!*\n\n` +
    `Dear ${name},\n\n` +
    `Your aid request has been successfully submitted to our system.\n\n` +
    ` *Reference ID:* ${refId}\n\n` +
    `Please keep this ID safe. You will receive updates here on WhatsApp as your request progresses.\n\n` +
    `-HOPECONNECT-`,

  statusChanged: (name: string, refId: string, newStatus: string) => {
    const statusMessages: Record<string, string> = {
      pending:     " Your request is *pending* and will be assigned soon.",
      gn_assigned: " Your request has been *assigned to a GN Officer* for field verification.",
      verified:    " Your request has been *verified* and is under review by the NGO.",
      flagged:     " Your request has been *flagged* for additional review. An officer will contact you.",
      resolved:    " Your request has been *resolved*! Support has been arranged for you.",
      rejected:    " Unfortunately, your request has been *rejected*. Please contact your GN Officer for details.",
    };
    return (
      ` *Request Status Update*\n\n` +
      `Dear ${name},\n\n` +
      `${statusMessages[newStatus] || `Status updated to: *${newStatus}*`}\n\n` +
      ` *Reference ID:* ${refId}\n\n` +
      `-HOPECONNECT-`
    );
  },

  gnAssigned: (name: string, refId: string, gnDivision: string) =>
    ` *GN Officer Assigned*\n\n` +
    `Dear ${name},\n\n` +
    `A Grama Niladhari Officer from *${gnDivision}* has been assigned to verify your request.\n\n` +
    `They may visit your home or contact you for verification.\n\n` +
    ` *Reference ID:* ${refId}\n\n` +
    `-HOPECONNECT-`,

  
  requestVerified: (name: string, refId: string) =>
    ` *Request Verified!*\n\n` +
    `Dear ${name},\n\n` +
    `Your request has been *successfully verified* by the GN Officer.\n\n` +
    `Your case is now being reviewed by the NGO administration for support allocation.\n\n` +
    ` *Reference ID:* ${refId}\n\n` +
    `-HOPECONNECT-`,

  
  requestResolved: (name: string, refId: string) =>
    ` *Great News!*\n\n` +
    `Dear ${name},\n\n` +
    `Your support request has been *resolved*. The necessary assistance has been arranged for your family.\n\n` +
    `We hope this support makes a difference. Thank you for trusting us.\n\n` +
    ` *Reference ID:* ${refId}\n\n` +
    `-HOPECONNECT-`,

  gnOfficerAssigned: (
    officerName: string,
    totalAssigned: number,
    gnDivision: string,
    month: string
  ) =>
    `*Monthly Assignment Notice*\n\n` +
    `Dear ${officerName},\n\n` +
    `You have been assigned *${totalAssigned} new request(s)* from *${gnDivision}* for verification this month (${month}).\n\n` +
    `Please log in to the portal to review and verify these cases.\n\n` +
    ` Portal: http://localhost:5173/login\n\n` +
    `-HOPECONNECT-`,
};
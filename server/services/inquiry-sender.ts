import type { Supplier } from "@shared/schema";

// SendGrid integration - Reference: https://sendgrid.com/docs/
async function getUncachableSendGridClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }

  const connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=sendgrid",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key || !connectionSettings.settings.from_email) {
    throw new Error("SendGrid not connected");
  }

  const sgMail = (await import("@sendgrid/mail")).default;
  sgMail.setApiKey(connectionSettings.settings.api_key);
  return {
    client: sgMail,
    fromEmail: connectionSettings.settings.from_email,
  };
}

export async function sendEmailInquiry(
  supplier: Supplier,
  message: string
): Promise<void> {
  if (!supplier.email) {
    throw new Error("Supplier has no email address");
  }

  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const beforeMessage = "Dear Partner,\n\nWe have a requirement for the following items:";
    const afterMessage = "\nCondition: Must be New / Factory Sealed.\nShipping Terms: EXW\n\nLooking forward to your proposal.\n\nBest regards,\nGreg, COO\nCHIP Technologies\nArmenia";
    const fullMessage = beforeMessage + "\n\n" + message + "\n" + afterMessage;

    await client.send({
      to: supplier.email,
      from: `CHIP Technologies <${fromEmail}>`,
      replyTo: "info@chip.am",
      subject: `Product Inquiry - Quote Request`,
      text: fullMessage,
      html: `<p>${fullMessage.replace(/\n/g, "<br>")}</p>`,
    });

    console.log(`Email sent successfully to ${supplier.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${supplier.email}:`, error);
    throw error;
  }
}

export async function sendWhatsAppInquiry(
  supplier: Supplier,
  message: string
): Promise<string> {
  if (!supplier.whatsapp) {
    throw new Error("Supplier has no WhatsApp number");
  }

  try {
    // Use WhatsApp web link for now - user can click to open WhatsApp
    const beforeMessage = "Dear Partner,\n\nWe have a requirement for the following items:";
    const afterMessage = "\nCondition: Must be New / Factory Sealed.\nShipping Terms: EXW\n\nLooking forward to your proposal.\n\nBest regards,\nGreg, COO\nCHIP Technologies\nArmenia";
    const fullMessage = beforeMessage + "\n\n" + message + "\n" + afterMessage;

    // Format: https://wa.me/[country-code][phone-number]
    const phoneNumber = supplier.whatsapp.replace(/\D/g, "");
    const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(fullMessage)}`;

    console.log(`WhatsApp message ready at: ${waLink}`);
    
    // Return the link so frontend can open it
    return waLink;
  } catch (error) {
    console.error(`Failed to prepare WhatsApp message for ${supplier.whatsapp}:`, error);
    throw error;
  }
}

export async function sendInquiry(
  suppliers: Supplier[],
  message: string,
  sendViaWhatsApp: boolean,
  sendViaEmail: boolean
): Promise<{ supplier: string; email?: string; whatsapp?: string; whatsappLink?: string; error?: string }[]> {
  const results: { supplier: string; email?: string; whatsapp?: string; whatsappLink?: string; error?: string }[] = [];

  for (const supplier of suppliers) {
    const result: (typeof results)[0] = { supplier: supplier.name };

    if (sendViaEmail && supplier.email) {
      try {
        await sendEmailInquiry(supplier, message);
        result.email = "sent";
      } catch (error) {
        console.error(`Email failed for ${supplier.name}:`, error);
        result.error = `Email: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }

    if (sendViaWhatsApp && supplier.whatsapp) {
      try {
        const link = await sendWhatsAppInquiry(supplier, message);
        result.whatsapp = "ready";
        result.whatsappLink = link;
      } catch (error) {
        console.error(`WhatsApp failed for ${supplier.name}:`, error);
        if (!result.error) {
          result.error = `WhatsApp: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      }
    }

    results.push(result);
  }

  console.log("Inquiry sending results:", results);
  return results;
}

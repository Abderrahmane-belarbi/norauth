import "dotenv/config";
import { google, type gmail_v1 } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { requireEnv, validateEmail } from "../lib/utils/input.utils";

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

let gmailClient: gmail_v1.Gmail | undefined;

function getGmailClient(): gmail_v1.Gmail {
  if (!gmailClient) {
    const oauth2Client = new google.auth.OAuth2(
      requireEnv("GOOGLE_CLIENT_ID"),
      requireEnv("GOOGLE_CLIENT_SECRET"),
    );

    oauth2Client.setCredentials({
      refresh_token: requireEnv("REFRESH_TOKEN"),
    });

    gmailClient = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });
  }

  return gmailClient;
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: SendMailOptions): Promise<gmail_v1.Schema$Message> {
  const from = requireEnv("EMAIL_FROM");
  validateEmail(from);

  const mail = new MailComposer({
    from: {
      name: requireEnv("APP_NAME"),
      address: from,
    },
    to: { name: "", address: to },
    subject,
    ...(text !== undefined ? { text } : {}),
    ...(html !== undefined ? { html } : {}),
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  const message = await mail.compile().build();

  const gmail = getGmailClient();

  try {
    const { data } = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: message.toString("base64url"),
      },
    });
    return data;
  } catch (error) {
    // Google API errors can include credentials and the raw email in request config.
    if (error instanceof Error && error.message === "invalid_grant") {
      throw new Error(
        "Gmail OAuth rejected REFRESH_TOKEN (invalid_grant). Reauthorize the sender account.",
      );
    }

    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined;
    throw new Error(
      typeof status === "number"
        ? `Gmail API request failed (HTTP ${status}).`
        : "Gmail API request failed.",
    );
  }
}
